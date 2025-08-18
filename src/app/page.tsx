// app/page.tsx (サーバーコンポーネントとして実装)
import { redirect } from 'next/navigation';

export default function Home() {
  // 初期表示時に /login-user へ遷移させる
  redirect('/login-user');
}
