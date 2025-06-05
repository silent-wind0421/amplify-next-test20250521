"use client";

import React, { useState, useEffect } from 'react';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter, usePathname } from 'next/navigation';
import "./list.css"

export default function ListPage() {
    // サンプルデータ
    const today = new Date().toLocaleDateString();
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [members, setMembers] = useState([
      {
        name: '真 屋太郎',
        schedule: '16:00',
        contract: '1時間40分',
        arrival: '',
        leaving: '',
        usage: '',
      },
      {
        name: '春野 度利夢',
        schedule: '16:15',
        contract: '1時間40分',
        arrival: '',
        leaving: '',
        usage: '',
      },
    ]);
    
    const columns = [
      { key: 'name', label: '利用者名' },
      { key: 'schedule', label: '来所予定時刻' },
      { key: 'contract', label: '契約利用時間' },
      { key: 'arrival', label: '来所時刻' },
      { key: 'leaving', label: '退所時刻' },
      { key: 'usage', label: '実利用時間' },
    ];
    
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleInputChange = (index: number, field: 'arrival' | 'leaving', value: string) => {
      const updatedMembers = [...members];
      updatedMembers[index][field] = value;
      setMembers(updatedMembers);
    };
    
    const handleSort = (key: string) => {
      if (sortConfig?.key === key) {
        // 同じカラムなら昇降反転
        setSortConfig({
          key,
          direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
        });
      } else {
        // 新しいカラムをソート
        setSortConfig({ key, direction: 'asc' });
      }
    };

    interface Member {
      name: string;
      schedule: string;
      contract: string;
      arrival: string;
      leaving: string;
      usage: string;
    }
    
    const sortedMembers = [...members].sort((a: Member, b: Member) => {
      if (!sortConfig) return 0;
    
      const aVal = a[sortConfig.key as keyof Member] || '';
      const bVal = b[sortConfig.key as keyof Member] || '';
    
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
     
    const { authStatus, signOut } = useAuthenticator((context) => [context.authStatus, context.signOut]);
    const router = useRouter();
    const pathname = usePathname(); 
    const context = useAuthenticator();
    // ✅ 認証状態が unauthenticated になったらサインインページへ戻る
    useEffect(() => {
     
      if (authStatus === 'configuring') return; 
      if (!router) return;
      
      console.log(pathname);
      console.log(context);
      

      if (authStatus === 'unauthenticated') {
        console.log("loginしてません")
        router.push('/');
      }else{

        alert("ここですよ");
        console.log("いますか？");
      }
    }, [authStatus, router]);


    return (

     
      <main style={{ padding: '2rem', position: 'relative' }}>
        <h1>通所実績管理</h1>
        <p></p>
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          padding: '16px',
          fontWeight: 'bold'
        }}>
        
          利用日：{today}
        </div>

        <div className="table-wrapper">
        {/* 表示件数セレクト：右寄せ */}
         {/* <div className="table-controls">
            <label>
              表示件数：
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10件表示</option>
                <option value={20}>20件表示</option>
              </select>
            </label>
          </div> 
          */}

          <table className="member-table">
            <thead>
              <tr>
                {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="table-th"
                  onClick={() => handleSort(key)}
                >
                {label} {sortConfig?.key === key ? (sortConfig.direction === 'asc' ? '△' : '▽') : ''}
                </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedMembers.slice(0, itemsPerPage).map((member, index) => (
              <tr key={index}>
                <td className="table-td">{member.name}</td>
                <td className="table-td">{member.schedule}</td>
                <td className="table-td">{member.contract}</td>
                <td className="table-td">
                  <input
                    type="time"
                    value={member.arrival}
                    placeholder="waiting"
                    onChange={(e) => handleInputChange(index, 'arrival', e.target.value)}
                  />
                </td>
                <td className="table-td">
                  <input
                    type="time"
                    value={member.leaving}
                    placeholder="waiting"
                    onChange={(e) => handleInputChange(index, 'leaving', e.target.value)}
                  />
                </td>
                <td className="table-td">{member.usage}</td>
              </tr>
              ))}
              </tbody>

          </table>
        </div>

          {/* 左下にログアウトボタン */}
      <button
        onClick={() => signOut()}
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          padding: "10px 16px",
          backgroundColor: "#e00",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        ログアウト
      </button>            


      </main>

      
    );
  }
  
  