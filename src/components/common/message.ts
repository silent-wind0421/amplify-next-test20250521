export class Message {

/** 来所登録完了メッセージ */
static readonly IA000001 = "来所を記録しました";

/** 退所登録完了メッセージ */
static readonly IA000002 = "退所を記録しました";
//static readonly 

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


}