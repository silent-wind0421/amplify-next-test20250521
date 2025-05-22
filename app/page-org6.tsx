"use client";

import React, { useState } from "react";
import { signIn, fetchAuthSession } from "aws-amplify/auth";

export default function CustomSignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signIn({ username, password });
      const session = await fetchAuthSession(); // セッション取得
      console.log("ログイン成功", session);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました");
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="ユーザー名"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        required
      />
      <button type="submit">ログイン</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>ログイン成功！</p>}
    </form>
  );
}
