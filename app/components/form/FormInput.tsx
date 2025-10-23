import * as styles from './FormInput.styles'; // スタイルファイルをインポート

// (1) このコンポーネントが受け取るprops（引数）の型を定義
type FormInputProps = {
  label: string;
  type: 'text' | 'email' | 'password'; // 受け付けるタイプを限定
  id: string; // labelとinputを紐付けるため
  placeholder?: string; // オプション
};

// (2) コンポーネント本体
export const FormInput = ({
  label,
  type,
  id,
  placeholder = 'Input', // デフォルト値
}: FormInputProps) => {
  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
};