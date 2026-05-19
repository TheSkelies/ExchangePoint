# ExchangePoint

ExchangePoint — учебный веб‑проект для обмена валют: просмотр курсов, управление курсами продавцом, пополнение баланса картой и просмотр истории операций.  
Проект состоит из двух частей:
- **backend** на Python/FastAPI (API + работа с БД)
- **frontend** на Node.js (веб‑интерфейс)

---

## Запуск проекта

### 1) Установка зависимостей

#### Backend (Python)
Перейдите в папку бэкенда и установите зависимости из `requirements.txt`:

```bash
cd backend
pip install -r requirements.txt
```


#### Frontend (Node.js)
Перейдите в папку фронтенда и установите зависимости:

```bash
cd frontend
npm install
```

---

### 2) Настройка переменных окружения

Заполните файл `.env` на основе примера `.env.example`:
1. Скопировать `.env.example` → `.env`
2. Заполнить значения переменных в `.env`

---

### 3) Запуск

#### Терминал №1 — запуск сервера (backend)
```bash
cd backend
fastapi run main.py
```

#### Терминал №2 — запуск клиента (frontend)
```bash
cd frontend
npm run dev
```

После запуска откройте адрес, который покажет Vite.

---
