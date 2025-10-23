import { css } from '@ss/css';

// ページ全体のコンテナ
export const container = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8', // 32px
  fontFamily: 'sans-serif',
  maxWidth: '400px', // フォーム全体の幅をここで制御
  margin: '0 auto', // ページ全体を中央揃え
});

// ヘッダーを置くラッパー
export const headerWrapper = css({
  width: '100%',
  marginBottom: '6', // 24px
});

// "新規登録ページ" のタイトル
export const heading = css({
  fontSize: '2xl', // 24px
  fontWeight: 'bold',
  marginBottom: '6', // 24px
});