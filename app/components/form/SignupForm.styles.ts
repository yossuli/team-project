import { css } from '@ss/css';

// <form> タグ用のスタイル
export const form = css({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '4', // 各入力欄の間のスペース (16px)
});

// "同意" チェックボックスの行全体
export const checkboxContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2', // 8px
});

// チェックボックス本体
export const checkbox = css({
  width: '4', // 16px
  height: '4',
});

// チェックボックスのラベル
export const checkboxLabel = css({
  fontSize: 'sm', // 14px
  color: 'gray.700',
});

// --- 👇 [追加] 登録ボタンのスタイル ---
export const button = css({
  width: 'auto',
  alignSelf: 'center', // 中央寄せ
  backgroundColor: 'black',
  color: 'white',
  fontWeight: 'bold',
  padding: '2 6', // 8px 24px
  borderRadius: 'md',
  cursor: 'pointer',
  marginTop: '4', // 16px
  _hover: { // ホバー時のスタイル
    backgroundColor: 'gray.800',
  },
});