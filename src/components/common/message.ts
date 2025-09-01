export class Message {

/** 来所登録完了メッセージ */
static readonly IA000001 = "来所を記録しました";

/** 退所登録完了メッセージ */
static readonly IA000002 = "退所を記録しました";

/** 退所時刻の更新・失敗メッセージ */
static readonly EA000004 = "退所時刻の更新に失敗しました";

/** 備考欄入力完了メッセージ */
static readonly IA000003 = "備考を更新しました";

/** 早退/超過理由更新メッセージ */
static readonly IA000004 = "早退/超過理由を更新しました";

/** サーバーエラーが発生時のメッセージ */
static readonly EC000001 = "サーバーエラーが発生しました。システム管理者に問い合わせください。";

/** QRコード読み取り不良 */
static readonly EU020001 ="QRコードがよめなかったみたい。もういちどためしてみてね！";

/** 来所時刻の更新・編集メッセージ */
static readonly IA000005 = "来所時刻の更新が行われました";

/** 退所時刻の更新・編集メッセージ */
static readonly IA000006 = "退所時刻の更新が行われました";

/** データの保存*/
static readonly IC000002 = "保存しました";

/** セッションの有効期限切れ*/
static readonly IF000003 = "セッションの有効期限が切れました。再度ログインしてください。";

/** タイムアウトエラー*/
static readonly EC000009 = "タイムアウトエラーが発生しました。";

/**  QR読み込み後のエラーが発生　画面遷移が起きない*/
static readonly EU020002 = "QR読み取り後のエラーが発生しました";

/** VisitDateに合致するデータが存在しない (登録された通所日ではない)*/
static readonly EU020003 = "該当する通所日ではありません。";

/** 同じQRが読み込まれた */
static readonly EU020004 = "QRコードが重複スキャンされました。(来所)";

/**  同じQRが読み込まれた */
static readonly EU020005 = "QRコードが重複スキャンされました。(退所)";

/** 来所予定日と異なります */
static readonly EF050001 = "登録日と異なります。";

/** 通所実績に反映されていない */
static readonly EF050002 = "利用日の登録がありません。";

/** createVisitDataのフォーマットにYYYY-MM-DD T HH:mm ss Z (ISO8601形式)に入力されていない。 */
static readonly EF050003 = "正しい日付の入力をお願いいたします。";

/** DB上に児童IDの登録がされていない */
static readonly EF050004 = "児童IDが登録されていません。";

/** 予期しないエラーが発生 */
static readonly EF050005 = "予期しないエラーが発生しました。システム管理者に問い合わせしてください。";

/** DBに受給者IDが登録されていない(recipientIDの登録情報が不足) */
static readonly EF050006 = "受給者証の情報が登録されておりません。";

/** データの削除失敗 */
static readonly EF050007 = "データ削除に失敗しました。";

/** 日付が未来日になっている */
static readonly EF050008 = "到来していない日付になっています。正しい日付を確認してください。";

/** 実際の利用時間と登録時間のマイナスが発生している */
static readonly EF050009 = "実利用時間が実際の利用時間より短く記録されている可能性があります。ご確認ください。";

/** 実際に利用した時間が予定した時間より少ない場合 */
static readonly EF050010 = "実際の利用時間が少ないようです。ご確認ください。";

/** 15分以内に入退場の記録をしようとした。（事業所によって変動する） */
static readonly EF050011 = "時間内に同じ操作が行われました。";

/** 指定パスに指定ファイルが存在しない場合 例C:\work\dat\〇〇〇.csv */
static readonly EB050001 = "指定のファイルが存在しません。";

/** 入力された情報に抜け漏れや入力されていない場合 */
static readonly EB050002 = "データが空です。";

/** 氏名入力の半角スペースが無い、規定された数字の桁数が多い、少ない(受給者情報番号など) */
static readonly EB050003 = "フォーマットが不正です。";

/** 指定された書式ではない場合 */
static readonly EB050004 = "指定の書式ではありません。";

/** 生年月日の書式がフォーマットと違う場合 */
static readonly EB050005 = "生年月日がyyyy/M/dではありません。";

/** 13月や32日など通常と異なる日付の入力があった場合 */
static readonly EB050006 = "生年月日に存在しない";

/** 同一PKに対して異なる児童の情報が入力された時に発生。 */
static readonly EB050007 = "同一IDに対して異なる児童情報があります。";

/** DynamoDBの設定や接続に失敗した時に発生 */
static readonly EB050008 = "DynamoDBの接続に失敗しました。";

/** 情報を追加した時に失敗した時に発生 */
static readonly EB050009 = "DynamoDBの書き込みに失敗しました。";

/** CSVの項目が不正であった場合 */
static readonly EB050010 = "列インデックス{0}に有効なヘッダーが存在しません。";

/** システムエラー、もしくは接続先のDBが間違い */
static readonly EF050012 = "DynamoDBの更新失敗";

/** 退所記録がすでに記録されている場合など */
static readonly EF050013 = "DynamoDBへの退所記録に失敗しました。";

/** 31時や99分など、想定の範囲を超えた時間の入力があった場合 */
static readonly EF050014 = "無効な時刻形式です。";

/** 時刻の形式が不正な場合 */
static readonly EF050015 = "時刻は HH:mm 形式で入力してください。（例=09:30）";

/** 来所時刻より前に退所時刻を登録した際に発生 */
static readonly EF050017 = "退所時刻は来所時刻より後である必要があります。";

/** DynamoDBへの反映ができなかった場合、通信エラーなど */
static readonly EF050018 = "DynamoDBへの反映に失敗しました。";

/** 備考欄が極端に文字数が多い場合など */
static readonly EF050019 = "備考欄の保存エラー";

/** データベースとの通信エラーもしくはシステム障害発生 */
static readonly EF050020 = "DynamoDBへの保存に失敗しました。";

/** 通信エラーなどのシステムエラー */
static readonly EF050021 = "DynamoDBの保存エラーが発生しました。";

/** 登録された時刻を削除した場合 */
static readonly EF050022 = "時刻をリセットしました。";

/** DynamoDBに正常に記録された場合 */
static readonly EF050023 = "DynamoDBに反映されました。";

/** システムエラーによる、登録内容のエラー発生*/
static readonly EF050024 = "リセットエラーが発生しました。";

/** DynamoDBの反映失敗 */
static readonly EF050025 = "DynamoDBの反映に失敗しました。";

/** DynamoDBに接続できず、システムエラーが発生 */
static readonly EF050026 = "DynamoDBへのリセット反映に失敗しました。";

}