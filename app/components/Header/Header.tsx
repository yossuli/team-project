// (1) スタイル定義の代わりに、'./styles.ts' をインポート
import * as styles from './Header.styles';

/**
 * 開発用の仮置きヘッダーコンポーネント
 */
export const Header = () => {
  return (
    // (2) 非常にスッキリしたJSX
    <header className={styles.header}>
      (ここにヘッダーが入ります)
    </header>
  );
};