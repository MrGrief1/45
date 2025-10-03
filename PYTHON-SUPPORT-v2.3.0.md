# 🐍 FlashSearch v2.3.0 - Поддержка Python и сред разработки!

## ✅ ЧТО ДОБАВЛЕНО:

### 🎯 НОВЫЙ ШАГ 7: Сканирование сред разработки

Теперь FlashSearch автоматически находит **ВСЕ** установленные среды разработки:

---

## 🐍 PYTHON - Полная поддержка!

### Методы поиска Python:

#### 1. **Через реестр Windows** (основной метод)
```
HKEY_LOCAL_MACHINE\SOFTWARE\Python\PythonCore
HKEY_CURRENT_USER\SOFTWARE\Python\PythonCore
```

**Что находит:**
- ✅ Python 3.12, 3.11, 3.10, 3.9, 3.8
- ✅ Python 2.7 (если установлен)
- ✅ Автоматическое определение версии
- ✅ Чтение InstallPath из реестра

#### 2. **Известные локации** (резервный метод)

**Program Files:**
- `C:\Program Files\Python312`
- `C:\Program Files\Python311`
- `C:\Program Files\Python310`
- `C:\Program Files\Python39`
- `C:\Program Files\Python38`

**Program Files (x86):**
- `C:\Program Files (x86)\Python312`
- `C:\Program Files (x86)\Python311`
- `C:\Program Files (x86)\Python310`

**Корень диска C:\ (старые установки):**
- `C:\Python312`
- `C:\Python311`
- `C:\Python310`
- `C:\Python39`
- `C:\Python38`
- `C:\Python27`

**AppData (пользовательские установки):**
- `%LOCALAPPDATA%\Programs\Python\Python312`
- `%LOCALAPPDATA%\Programs\Python\Python311`
- `%LOCALAPPDATA%\Programs\Python\Python310`

**Anaconda:**
- `C:\ProgramData\Anaconda3`
- `%USERPROFILE%\Anaconda3`
- `%USERPROFILE%\anaconda3`

**Miniconda:**
- `C:\ProgramData\Miniconda3`
- `%USERPROFILE%\Miniconda3`
- `%USERPROFILE%\miniconda3`

---

## 📦 NODE.JS - Полная поддержка!

**Стандартные установки:**
- `C:\Program Files\nodejs\node.exe`
- `C:\Program Files (x86)\nodejs\node.exe`

**nvm (Node Version Manager):**
- `%APPDATA%\nvm\v18.17.0\node.exe`
- `%APPDATA%\nvm\v16.20.0\node.exe`
- Все версии автоматически!

---

## ☕ JAVA - Полная поддержка!

**Поддерживаемые дистрибутивы:**
- ✅ Oracle JDK
- ✅ OpenJDK
- ✅ Eclipse Adoptium (Temurin)
- ✅ AdoptOpenJDK
- ✅ Amazon Corretto

**Локации поиска:**
- `C:\Program Files\Java\jdk-17`
- `C:\Program Files\Java\jre-11`
- `C:\Program Files\Eclipse Adoptium\jdk-21.0.1.12-hotspot`
- `C:\Program Files\Amazon Corretto\jdk17.0.9_8`

**Что находит:**
- ✅ Все версии JDK (Java Development Kit)
- ✅ Все версии JRE (Java Runtime Environment)
- ✅ Автоматическое определение версии из имени папки

---

## 🔧 GIT - Поддержка!

**Git Bash:**
- `C:\Program Files\Git\git-bash.exe`
- `C:\Program Files (x86)\Git\git-bash.exe`

**Git (command line):**
- `C:\Program Files\Git\cmd\git.exe`
- `C:\Program Files (x86)\Git\cmd\git.exe`

---

## 🐳 DOCKER - Поддержка!

**Docker Desktop:**
- `C:\Program Files\Docker\Docker\Docker Desktop.exe`
- `%LOCALAPPDATA%\Programs\Docker\Docker Desktop.exe`

---

## 🎯 КАК ЭТО РАБОТАЕТ:

### В логах вы увидите:

```log
[STEP 7] Scanning development environments (Python, Node.js, Java)...
[DEV] Scanning Python installations...
[DEV] ✓ Found Python 3.12 at C:\Program Files\Python312\python.exe
[DEV] ✓ Found Python 3.11 at C:\Python311\python.exe
[DEV] ✓ Found Anaconda Python at C:\ProgramData\Anaconda3\python.exe
[DEV] Scanning Node.js installations...
[DEV] ✓ Found Node.js at C:\Program Files\nodejs\node.exe
[DEV] ✓ Found Node.js v18.17.0
[DEV] ✓ Found Node.js v16.20.0
[DEV] Scanning Java installations...
[DEV] ✓ Found Java jdk-17
[DEV] ✓ Found Java jre-11
[DEV] ✓ Found Git Bash
[DEV] ✓ Found Docker Desktop
[DEV] Found 9 development tools
[STEP 7] Found 267 total apps after dev tools scan.
```

---

## 🔍 КАК НАЙТИ:

В поиске просто введите:
- `python` ✅ Найдет все версии Python
- `node` ✅ Найдет все версии Node.js
- `java` ✅ Найдет все версии Java
- `git` ✅ Найдет Git Bash и Git
- `docker` ✅ Найдет Docker Desktop
- `anaconda` ✅ Найдет Anaconda Python

---

## ⚡ ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ v2.3.0:

### 1. **Умная фильтрация мусора (isNoiseApp)**

**Теперь НЕ находятся:**
- ❌ Python Launcher (py.exe) - служебная программа
- ❌ Python Setup/Installer
- ❌ Node.js Uninstaller
- ❌ Java Update Scheduler
- ❌ Git Uninstaller
- ❌ Visual C++ Redistributable
- ❌ .NET Framework Runtime
- ❌ WebView2 Runtime

**Только полезные приложения!**

### 2. **shell:AppsFolder сканирование (ШАГ 1.2)**

Новый метод через PowerShell COM:
```powershell
$shell = New-Object -ComObject Shell.Application
$folder = $shell.NameSpace('shell:AppsFolder')
```

Находит больше UWP приложений!

### 3. **Registry App Paths (ШАГ 3.1)**

Дополнительный источник из реестра:
```
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths
```

---

## 📊 ИТОГОВАЯ СТРУКТУРА (9 ЭТАПОВ):

```
1.0  UWP/Store (Get-AppxPackage)
1.2  shell:AppsFolder (COM) ⭐ НОВОЕ
2.0  Start Menu
3.0  Windows Registry (Uninstall)
3.1  Registry App Paths ⭐ НОВОЕ
4.0  System Folders (глубина 4)
4.5  WindowsApps
5.0  Desktop Shortcuts
6.0  Known Locations (Roblox, Discord, Overwolf, etc.)
7.0  Development Tools ⭐ НОВОЕ
     ├─ 🐍 Python (Registry + локации)
     ├─ 📦 Node.js (Program Files + nvm)
     ├─ ☕ Java (все дистрибутивы)
     ├─ 🔧 Git (Bash + cmd)
     └─ 🐳 Docker Desktop
```

---

## 🎉 РЕЗУЛЬТАТ:

**ДО v2.3.0:**
- Python: ❌ Не находился автоматически
- Node.js: ❌ Не находился автоматически
- Java: ❌ Не находился автоматически
- Много мусора в результатах

**ПОСЛЕ v2.3.0:**
- Python: ✅ **ВСЕ версии находятся!**
- Node.js: ✅ **ВСЕ версии находятся!**
- Java: ✅ **ВСЕ версии находятся!**
- Git, Docker: ✅ **Находятся!**
- Anaconda, Miniconda: ✅ **Находятся!**
- **Нет мусора** - только полезные приложения!

---

## 💡 СОВЕТЫ:

1. **При первом запуске** индексация может занять 30-60 секунд
2. **Проверьте логи** для подробной информации о найденных средах
3. **Если Python не находится:**
   - Убедитесь что Python установлен
   - Проверьте реестр вручную: `regedit` → `HKEY_LOCAL_MACHINE\SOFTWARE\Python`
   - Сделайте **Rebuild Index** в настройках

4. **Для nvm версий Node.js:**
   - Папка должна быть `%APPDATA%\nvm`
   - Версии должны начинаться с `v` (например, `v18.17.0`)

---

## 🔍 ПРОВЕРКА:

Откройте лог файл:
```
%APPDATA%\FlashSearch-local-cache\FlashSearch_log.txt
```

Найдите строки:
```
[DEV] ✓ Found Python 3.12 at ...
[DEV] ✓ Found Node.js at ...
[DEV] ✓ Found Java ...
```

Если эти строки есть - всё работает! ✅

---

## 🚀 ЗАПУСК:

1. Запустите приложение (уже работает в фоне)
2. Дождитесь полной индексации
3. Введите в поиске `python`, `node`, `java`
4. Наслаждайтесь! 🎉

**Версия обновлена до 2.3.0!** ✅

---

## 📝 P.S. О ПЛАГИНАХ ИЗ FLUENT SEARCH:

Fluent Search использует архитектуру плагинов на C#/.NET для расширения функциональности.

**Основные плагины Fluent Search:**
- Number Converter (конвертер чисел)
- Translator (переводчик)
- Kill Process (убийца процессов)
- Clipboard (история буфера обмена)
- Firefox (закладки и история)
- Units Converter (конвертер единиц)
- DuckDuckGo Preview
- И многие другие...

**Для FlashSearch (JavaScript/Electron):**
- Текущая архитектура не поддерживает плагины .NET
- Но можно добавить аналогичную функциональность встроенно!

**Если хотите добавить плагины:**
1. Можно создать систему JavaScript плагинов
2. Можно добавить встроенную функциональность (калькулятор, переводчик и т.д.)
3. Можно интегрировать внешние API

**Давайте знать, если нужно добавить конкретную функциональность из плагинов Fluent Search!**

