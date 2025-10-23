// (1) スタイルとコンポーネントをインポート
import * as styles from './signup.styles';
import { Header } from '~/app/components/Header/Header';
import { SignupForm } from '~/app/components/form/SignupForm';

// (2) ページ本体
export default function SignupPage() {
  return (
    <div className={styles.container}>
      {/* 1. ヘッダー */}
      <div className={styles.headerWrapper}>
        <Header />
      </div>

      {/* 2. ページタイトル */}
      <h1 className={styles.heading}>
        新規登録ページ
      </h1>

      {/* 3. サインアップフォーム本体 */}
      <SignupForm />
    </div>
  );
}