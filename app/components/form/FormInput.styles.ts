import { css } from '@ss/css';

// フォームの各項目（ラベル＋入力）のラッパー
export const wrapper = css({
  width: '100%',
});

// ラベルのスタイル
export const label = css({
  display: 'block',
  fontSize: 'sm', // 14px
  color: 'gray.600',
  marginBottom: '1', // 4px
});

// 入力欄のスタイル
export const input = css({
  width: '100%',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  padding: '2 3', // 8px 12px
});