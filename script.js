/*
=========================================================
 SUPABASE 설정
=========================================================

1. Supabase에서 프로젝트 생성
2. Project Settings → API
3. 아래 두 값을 본인 프로젝트 값으로 교체

주의:
이 코드는 anon public key를 사용한다.
service_role key는 절대로 넣지 않는다.
=========================================================
*/

const SUPABASE_URL = "여기에_SUPABASE_URL";
const SUPABASE_ANON_KEY = "여기에_SUPABASE_ANON_KEY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/*
=========================================================
 상태
=========================================================
*/

let currentStep =
  Number(localStorage.getItem("memory_current_step")) || 1;

let draft = {
  memory: localStorage.getItem("draft_memory") || "",
  emotion: localStorage.getItem("draft_emotion") || "",
  feeling: localStorage.getItem("draft_feeling") || "",
  reflection: localStorage.getItem("draft_reflection") || "",
  category: localStorage.getItem("draft_category") || ""
};

let currentFilter = "전체";


/*
=========================================================
 DOM
=========================================================
*/

const questions =
  document.querySelectorAll(".question");

const nextButton =
  document.getElementById("nextButton");

const prevButton =
  document.getElementById("prevButton");

const saveButton =
  document.getElementById("saveButton");

const resetButton =
  document.getElementById("resetButton");

const memoryText =
  document.getElementById("memoryText");

const reflectionText =
  document.getElementById("reflectionText");

const dots =
  document.querySelectorAll(".progress-dots i");

const memoryList =
  document.getElementById("memoryList");

const memoryCount =
  document.getElementById("memoryCount");


/*
=========================================================
 페이지 이동
=========================================================
*/

function goTo(id) {

  const target =
    document.getElementById(id);

  if (!target) return;

  target.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/*
=========================================================
 단계 표시
=========================================================
*/

function showStep(step) {

  currentStep = step;

  localStorage.setItem(
    "memory_current_step",
    String(step)
  );

  questions.forEach(question => {

    question.classList.toggle(
      "active",
      Number(question.dataset.step) === step
    );

  });

  dots.forEach((dot, index) => {

    dot.classList.toggle(
      "active",
      index === step - 1
    );

  });

  if (step === 1) {

    prevButton.style.visibility = "hidden";

  } else {

    prevButton.style.visibility = "visible";

  }

  if (step === 4) {

    nextButton.style.display = "none";
    saveButton.style.display = "block";

  } else {

    nextButton.style.display = "block";
    saveButton.style.display = "none";

  }

}


/*
=========================================================
 ⭐ 다음 버튼
=========================================================
*/

nextButton.addEventListener("click", function () {

  if (currentStep < 4) {

    currentStep++;

    showStep(currentStep);

  }

});


/*
=========================================================
 ⭐ 이전 버튼
=========================================================
*/

prevButton.addEventListener("click", function () {

  if (currentStep > 1) {

    currentStep--;

    showStep(currentStep);

  }

});


/*
=========================================================
 입력값 저장
 새로고침해도 현재 작성 내용 유지
=========================================================
*/

memoryText.value =
  draft.memory;

reflectionText.value =
  draft.reflection;


memoryText.addEventListener("input", function () {

  draft.memory =
    this.value;

  localStorage.setItem(
    "draft_memory",
    draft.memory
  );

});


reflectionText.addEventListener("input", function () {

  draft.reflection =
    this.value;

  localStorage.setItem(
    "draft_reflection",
    draft.reflection
  );

});


/*
=========================================================
 선택 버튼
=========================================================
*/

document
  .querySelectorAll(".choices button")
  .forEach(button => {

    button.addEventListener("click", function () {

      const type =
        this.dataset.type;

      const value =
        this.dataset.value;


      document
        .querySelectorAll(
          `.choices button[data-type="${type}"]`
        )
        .forEach(other => {

          other.classList.remove("selected");

        });


      this.classList.add("selected");


      if (type === "emotion") {

        draft.emotion = value;

        localStorage.setItem(
          "draft_emotion",
          value
        );

      }


      if (type === "feeling") {

        draft.feeling = value;

        localStorage.setItem(
          "draft_feeling",
          value
        );

      }


      if (type === "category") {

        draft.category = value;

        localStorage.setItem(
          "draft_category",
          value
        );

      }

    });

  });


/*
=========================================================
 선택 상태 복구
=========================================================
*/

function restoreSelection(
  type,
  value
) {

  if (!value) return;

  document
    .querySelectorAll(
      `.choices button[data-type="${type}"]`
    )
    .forEach(button => {

      if (
        button.dataset.value === value
      ) {

        button.classList.add("selected");

      }

    });

}

restoreSelection(
  "emotion",
  draft.emotion
);

restoreSelection(
  "feeling",
  draft.feeling
);

restoreSelection(
  "category",
  draft.category
);


/*
=========================================================
 기억 저장
 → Supabase에 저장
 → 모든 사람이 같은 데이터를 볼 수 있음
=========================================================
*/

saveButton.addEventListener(
  "click",
  saveMemory
);


async function saveMemory() {

  draft.memory =
    memoryText.value.trim();

  draft.reflection =
    reflectionText.value.trim();


  if (!draft.memory) {

    alert("먼저 기억을 적어주세요.");

    showStep(1);

    memoryText.focus();

    return;

  }


  if (!draft.emotion) {

    alert("그때 느꼈던 감정을 선택해주세요.");

    showStep(2);

    return;

  }


  if (!draft.feeling) {

    alert("지금 느껴지는 감정을 선택해주세요.");

    showStep(3);

    return;

  }


  if (!draft.reflection) {

    alert(
      "그 경험을 통해 발견한 나의 모습을 적어주세요."
    );

    showStep(4);

    reflectionText.focus();

    return;

  }


  if (!draft.category) {

    alert("기억의 종류를 선택해주세요.");

    showStep(4);

    return;

  }


  saveButton.disabled = true;

  saveButton.textContent = "저장 중...";


  const {
    data,
    error
  } = await supabaseClient
    .from("memories")
    .insert([
      {
        memory: draft.memory,
        emotion: draft.emotion,
        feeling: draft.feeling,
        reflection: draft.reflection,
        category: draft.category
      }
    ])
    .select();


  saveButton.disabled = false;

  saveButton.textContent = "기억 남기기";


  if (error) {

    console.error(error);

    alert(
      "기억을 저장하지 못했습니다.\n\n" +
      "Supabase URL / Anon Key / 테이블 설정을 확인해주세요."
    );

    return;

  }


  alert("소중한 기억이 기록되었습니다 🤍");


  clearDraft();

  showStep(1);

  await loadMemories();

  goTo("archive");

}


/*
=========================================================
 작성 중인 내용 초기화
=========================================================
*/

resetButton.addEventListener(
  "click",
  function () {

    if (
      !confirm(
        "현재 작성 중인 내용을 모두 지울까요?"
      )
    ) {

      return;

    }

    clearDraft();

    showStep(1);

  }
);


function clearDraft() {

  draft = {
    memory: "",
    emotion: "",
    feeling: "",
    reflection: "",
    category: ""
  };


  localStorage.removeItem(
    "draft_memory"
  );

  localStorage.removeItem(
    "draft_emotion"
  );

  localStorage.removeItem(
    "draft_feeling"
  );

  localStorage.removeItem(
    "draft_reflection"
  );

  localStorage.removeItem(
    "draft_category"
  );

  localStorage.removeItem(
    "memory_current_step"
  );


  memoryText.value = "";

  reflectionText.value = "";


  document
    .querySelectorAll(".choices button")
    .forEach(button => {

      button.classList.remove(
        "selected"
      );

    });

}


/*
=========================================================
 ⭐ Supabase에서 모든 기억 가져오기
=========================================================
*/

async function loadMemories() {

  memoryList.innerHTML = `
    <div class="empty">
      기억을 불러오는 중...
    </div>
  `;


  const {
    data,
    error
  } = await supabaseClient
    .from("memories")
    .select("*")
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    memoryList.innerHTML = `
      <div class="empty">
        기억을 불러오지 못했습니다.
      </div>
    `;

    return;

  }


  renderMemories(data || []);

}


/*
=========================================================
 기억 표시
=========================================================
*/

function renderMemories(memories) {

  let filtered =
    memories;


  if (
    currentFilter !== "전체"
  ) {

    filtered =
      memories.filter(
        memory =>
          memory.category === currentFilter
      );

  }


  memoryCount.textContent =
    filtered.length;


  if (
    filtered.length === 0
  ) {

    memoryList.innerHTML = `
      <div class="empty">
        아직 기록된 기억이 없어요.<br><br>
        첫 번째 기억을 남겨주세요.
      </div>
    `;

    return;

  }


  memoryList.innerHTML =
    filtered
      .map((memory, index) => {

        return `
          <article class="memory-card">

            <div class="memory-number">
              MEMORY #${index + 1}
            </div>

            <h3>
              ${escapeHTML(memory.memory)}
            </h3>

            <p>
              그때의 감정 ·
              ${escapeHTML(memory.emotion)}
            </p>

            <p>
              지금의 마음 ·
              ${escapeHTML(memory.feeling)}
            </p>

            <p>
              기억이 남긴 생각 ·
              ${escapeHTML(memory.reflection)}
            </p>

            <span class="category">
              ${escapeHTML(memory.category)}
            </span>

          </article>
        `;

      })
      .join("");

}


/*
=========================================================
 필터
=========================================================
*/

document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      async function () {

        document
          .querySelectorAll(".filter")
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        this.classList.add("active");


        currentFilter =
          this.dataset.filter;


        await loadMemories();

      }
    );

  });


/*
=========================================================
 XSS 방지
=========================================================
*/

function escapeHTML(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/*
=========================================================
 공감 버튼
=========================================================
*/

function sendReaction(type) {

  alert(
    `${type}이(가) 전달되었어요 🤍`
  );

}


/*
=========================================================
 시작
=========================================================
*/

showStep(currentStep);

loadMemories();


/*
=========================================================
 다른 사람이 기억을 남겼을 때
 자동으로 목록 새로고침
=========================================================
*/

setInterval(
  loadMemories,
  10000
);
