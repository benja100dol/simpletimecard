document.addEventListener("DOMContentLoaded", () => {
  // メンバーの情報
  const members = [
    { 
      id: 1, 
      name: "nishida", 
      sleepingIcon: "nishida_sleeping.png",
      wakingIcon: "nishida_waking.png"
    },
    { 
      id: 2, 
      name: "hashimoto", 
      sleepingIcon: "hashimoto_sleeping.png",
      wakingIcon: "hashimoto_waking.png"
    }
  ];

  // ローカルストレージのキー
  const STORAGE_KEY = "teamClockIn";

  // メンバーごとの初期化
  members.forEach(member => {
    const button = document.getElementById(`clockInBtn${member.id}`);
    const status = document.getElementById(`status${member.id}`);
    const card = document.getElementById(`member${member.id}`);
    const monthlyTotal = document.getElementById(`monthlyTotal${member.id}`);
    const yearlyTotal = document.getElementById(`yearlyTotal${member.id}`);

    // 保存されたデータの読み込み
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const lastClockIn = history.find(h => h.memberId === member.id);

    // 24時リセットのチェック
    const now = new Date();
    const lastDate = history.length > 0 ? new Date(history[0].date) : null;
    if (lastDate && lastDate.getDate() !== now.getDate()) {
      localStorage.removeItem(STORAGE_KEY);
      history = [];
      updateButtonState(button, false);
      updateStatus(member.id, '', false);
      const icon = document.getElementById(`icon${member.id}`);
      icon.src = member.sleepingIcon;
    }

    if (lastClockIn) {
      const icon = document.getElementById(`icon${member.id}`);
      icon.src = member.awakeIcon;
      updateStatus(member.id, lastClockIn.time, lastClockIn.isEarly);
      updateButtonState(button, true);
    }

    // 出勤統計の更新
    updateAttendanceStats(member.id, history);

    // クロックインボタンのイベントリスナー
    button.addEventListener("click", () => {
      const now = new Date();
      const time = now.toLocaleTimeString();
      const icon = document.getElementById(`icon${member.id}`);
      icon.src = member.awakeIcon; // アイコンを起きている状態に変更
      const isEarly = now.getHours() < 7;
      
      // ヒストリーに追加
      const newHistory = {
        memberId: member.id,
        time: time,
        isEarly: isEarly,
        date: now.toLocaleDateString()
      };

      const updatedHistory = [...history.filter(h => h.memberId !== member.id), newHistory];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

      updateStatus(member.id, time, isEarly);
      updateButtonState(button, true);
      updateAttendanceStats(member.id, updatedHistory);
    });
  });

  // 履歴ボタンのイベントリスナー
  const historyBtn = document.getElementById("historyBtn");
  const historyModal = document.getElementById("historyModal");
  const closeHistory = document.getElementById("closeHistory");
  const historyList = document.getElementById("historyList");

  historyBtn.addEventListener("click", () => {
    historyModal.classList.remove("hidden");
    updateHistoryList();
  });

  closeHistory.addEventListener("click", () => {
    historyModal.classList.add("hidden");
  });

  // 関数定義
  function updateStatus(memberId, time, isEarly) {
    const status = document.getElementById(`status${memberId}`);
    const message = isEarly ? "出勤しました" : "遅刻しました";
    const mark = isEarly ? "◯" : "";
    status.textContent = `${message}: ${time} ${mark}`;
  }

  function updateButtonState(button, isDisabled) {
    button.disabled = isDisabled;
    button.classList.toggle("opacity-50", isDisabled);
  }

  function updateAttendanceStats(memberId, history) {
    const memberHistory = history.filter(h => h.memberId === memberId);
    const monthlyTotal = document.getElementById(`monthlyTotal${memberId}`);
    const yearlyTotal = document.getElementById(`yearlyTotal${memberId}`);
    
    if (!monthlyTotal || !yearlyTotal) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 月間出勤数（遅刻を除く）
    const monthlyCount = memberHistory.filter(h => {
      const date = new Date(h.date);
      return date.getFullYear() === currentYear && 
             date.getMonth() + 1 === currentMonth &&
             h.isEarly;
    }).length;

    // 年間出勤数（遅刻を除く）
    const yearlyCount = memberHistory.filter(h => {
      const date = new Date(h.date);
      return date.getFullYear() === currentYear &&
             h.isEarly;
    }).length;

    monthlyTotal.textContent = monthlyCount;
    yearlyTotal.textContent = yearlyCount;
  }

  function updateHistoryList() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    historyList.innerHTML = '';

    // 日付ごとにグループ化
    const groupedHistory = {};
    history.forEach(entry => {
      if (!groupedHistory[entry.date]) {
        groupedHistory[entry.date] = [];
      }
      groupedHistory[entry.date].push(entry);
    });

    // 最新の日付から表示
    Object.entries(groupedHistory).sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, entries]) => {
      const dateDiv = document.createElement("div");
      dateDiv.className = "text-lg font-bold mb-2";
      dateDiv.textContent = date;
      historyList.appendChild(dateDiv);

      entries.forEach(entry => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "flex justify-between p-2 border-b border-gray-200";
        entryDiv.innerHTML = `
          <span>${members.find(m => m.id === entry.memberId).name}</span>
          <span>${entry.time}${entry.isEarly ? " ◯" : " ✕"}</span>
        `;
        historyList.appendChild(entryDiv);
      });
    });
  }
});
