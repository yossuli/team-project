// (1) stylesから 'button' もインポートする
import * as styles from './SignupForm.styles';
import { FormInput } from './FormInput';
// (2) '@ss/recipes' からのインポートは不要なので削除 (またはコメントアウト)
// import { button } from '@ss/recipes'; 

export const SignupForm = () => {
  return (
    <form className={styles.form}>
      {/* (3) FormInputコンポーネント (変更なし) */}
      <FormInput
        id="email"
        label="メールアドレス入力"
        type="email"
      />
      <FormInput
        id="password"
        label="パスワード入力"
        type="password"
      />
      <FormInput
        id="password-confirm"
        label="パスワード入力(確認用)"
        type="password"
      />

      {/* (4) 同意チェックボックス (変更なし) */}
      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          id="terms"
          className={styles.checkbox}
        />
        <label
          htmlFor="terms"
          className={styles.checkboxLabel}
        >
          利用規約・プライバシーポリシーへの同意
        </label>
      </div>

      {/* (5) 登録ボタン [修正済み] */}
      <button type="submit" className={styles.button}>
        登録
      </button>
    </form>
  );
};