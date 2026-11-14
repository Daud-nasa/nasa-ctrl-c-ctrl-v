import './styles.css';

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: {
      ready(): void;
      expand(): void;
    };
  };
}

const telegram = (window as TelegramWindow).Telegram?.WebApp;
telegram?.ready();
telegram?.expand();
