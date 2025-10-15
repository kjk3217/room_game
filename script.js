// 기존 script.js 파일의 모든 내용을 지우고 아래 코드를 붙여넣으세요.

// 게임 상태
let currentRoom = 1;
let completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes')) || [];
let currentQuiz = null;

// 타이머 관련 변수
let roomTimer = null;
let timeLeft = 600; // 10분 = 600초
let tickSound = null;
let isTimerActive = false;

// 사운드 관련 변수
let backgroundMusic = null;
let clickSound = null;
let soundsLoaded = false;
let confettiInterval = null;

// 전환 비디오 설정 (엔딩 비디오 제거)
const transitionVideos = {
    start: 'videos/start_to_room1.mp4',      // 시작 → 방1
    room1: 'videos/room1_to_room2.mp4',      // 방1 → 방2
    room2: 'videos/room2_to_room3.mp4'       // 방2 → 방3
};

// ▼▼▼ 스토리 데이터 추가 ▼▼▼
const roomStories = {
    1: {
        title: "🔮 첫 번째 비밀의 방 🔮",
        text: "첫 번째 잠금장치는 단어 분류와 관련이 있다. 단어들을 어떤 기준으로 나누어야 하는지 파악하고, 첫 번째 방을 탈출하라!"
    },
    2: {
        title: "🔮 두 번째 비밀의 방 🔮",
        text: "두 번째 방의 열쇠는 문장에서 가장 중요한 역할을 하는 단어들, 각각의 역할을 이해하고 퀴즈를 풀어 두 번째 방의 비밀번호를 알아내라!"
    },
    3: {
        title: "🔮 마지막 비밀의 방 🔮",
        text: "마지막 방이다. 문장을 더욱 다채롭게 만들어주는 단어들이 제자리를 잃고 흩어져 있다. 다른 말을 꾸며주고, 관계를 맺어주는 단어들을 올바르게 짝지어 질서를 되찾아라. 모든 퀴즈를 풀면 최종 탈출 암호가 나타날 것이다!"
    }
};
let shownStories = JSON.parse(localStorage.getItem('shownStories')) || [];
// ▲▲▲ 스토리 데이터 추가 ▲▲▲

// 퀴즈 데이터
const quizzes = {
    // 방 1: 품사의 기본 개념
    1: {
        title: "품사의 기본 개념",
        question: "단어를 공통된 성질에 따라 갈래를 나누어 놓은 것을 무엇이라고 할까요?",
        answers: ["품사"],
        type: "single"
    },
    2: {
        title: "품사의 종류",
        question: "문장에서 쓰일 때 형태가 변하는 단어(가변어)에 속하는 품사 두 가지는 동사와 무엇일까요?",
        answers: ["형용사"],
        type: "single"
    },
    3: {
        title: "품사의 분류 기준",
        question: "단어를 분류하는 세 가지 기준은 '형태', '의미' 그리고 무엇일까요?",
        answers: ["기능"],
        type: "single"
    },
    4: {
        title: "품사 분류하기 (첫 번째 방 탈출)",
        question: "주어진 단어들을 '형태가 변하는 말'과 '형태가 변하지 않는 말'로 올바르게 분류하여 방을 탈출하세요.",
        type: "word_classification",
        words: ['먹다', '예쁘다', '날다', '슬프다', '공부하다', '하늘', '나무', '아주', '와', '책'],
        categories: ['형태가 변함', '형태가 변하지 않음'],
        correctClassification: {
            '형태가 변함': ['먹다', '예쁘다', '날다', '슬프다', '공부하다'],
            '형태가 변하지 않음': ['하늘', '나무', '아주', '와', '책']
        }
    },
    // 방 2: 체언과 용언
    5: {
        title: "체언의 종류",
        question: "다음 빈칸에 들어갈 알맞은 단어를 순서대로 채우세요.\n\n1. 사람이나 사물의 이름을 나타내는 품사는? (예: 하늘, 사랑)\n2. 이름을 대신하여 가리키는 품사는? (예: 나, 우리, 여기)\n3. 수량이나 순서를 나타내는 품사는? (예: 하나, 첫째)\n4. 위 세 품사를 묶어 OOO이라고 합니다.",
        answers: ["명사", "대명사", "수사", "체언"],
        type: "four"
    },
    6: {
        title: "용언의 종류 (1)",
        question: "사람이나 사물의 움직임을 나타내는 품사는 무엇일까요? (예: 먹다, 달리다)",
        answers: ["동사"],
        type: "single"
    },
    7: {
        title: "품사 배열하기",
        question: "예시 문장: '나는 새 신발을 샀다.'\n\n아래 품사들을 위 문장의 순서에 맞게 올바르게 배열하세요.",
        shuffledWords: ["대명사", "조사", "관형사", "명사", "조사", "동사"].sort(() => Math.random() - 0.5),
        correctOrder: ["대명사", "조사", "관형사", "명사", "조사", "동사"],
        type: "word_sort"
    },
    8: {
        title: "두 번째 방 탈출",
        question: "두 번째 방을 탈출하기 위한 <span class='highlight-red'>비밀번호</span>. (힌트: 동사와 형용사를 묶어 이르는 말)",
        answers: ["119"],
        type: "password"
    },
    // 방 3: 수식언, 관계언, 독립언
    9: {
        title: "수식언의 종류 (1)",
        question: "문장에서 주로 체언(명사, 대명사, 수사)을 꾸며 주는 역할을 하는 품사는 무엇일까요? (예: 새, 헌, 이, 그, 저)",
        answers: ["관형사"],
        type: "single"
    },
    10: {
        title: "품사 짝짓기",
        question: "각 품사와 그에 대한 설명을 올바르게 연결하세요.",
        periods: ["명사", "동사", "부사", "조사", "감탄사"],
        laws: ["대상의 이름을 나타냄", "대상의 움직임을 나타냄", "주로 용언을 꾸며 줌", "다른 말과의 문법적 관계를 나타냄", "놀람, 느낌, 부름, 대답을 나타냄"],
        correctMatches: {
            "명사": "대상의 이름을 나타냄",
            "동사": "대상의 움직임을 나타냄",
            "부사": "주로 용언을 꾸며 줌",
            "조사": "다른 말과의 문법적 관계를 나타냄",
            "감탄사": "놀람, 느낌, 부름, 대답을 나타냄"
        },
        type: "matching"
    },
    11: {
        title: "관계언",
        question: "문장에서 다른 단어와의 문법적 관계를 나타내거나 특별한 뜻을 더해주는 품사는 무엇일까요? (예: 이/가, 을/를, 은/는, 도)",
        answers: ["조사"],
        type: "single"
    },
    12: {
        title: "마지막 방 탈출",
        question: "마지막 방을 탈출하기 위한 <span class='highlight-red'>암호</span>.",
        answers: ["품사"],
        type: "password"
    }
};

// === ✨ 전체 화면 실행을 위한 함수 추가 ✨ ===
function requestFullScreen() {
    const elem = document.documentElement; // 전체 페이지를 대상으로 함
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(console.error);
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari, Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}
// ===========================================

// === ✨ 순차 진행을 위한 함수 (새로 추가) ✨ ===
/**
 * 모든 클릭 가능한 오브젝트의 상태(잠김/활성/완료)를 업데이트합니다.
 * 게임 시작, 재개, 정답을 맞췄을 때 호출됩니다.
 */
function updateClickableStates() {
    // 다음으로 풀어야 할 퀴즈 ID (완료된 퀴즈가 0개면 1번, 1개면 2번...)
    const nextQuizId = completedQuizzes.length + 1;

    const allClickables = document.querySelectorAll('.clickable');
    allClickables.forEach(element => {
        const quizId = parseInt(element.dataset.quizId, 10);

        // 먼저 모든 상태 관련 클래스를 초기화
        element.classList.remove('locked', 'unlocked-glowing');

        if (completedQuizzes.includes(quizId)) {
            // 이미 완료된 퀴즈는 .completed 클래스가 있으므로 그대로 둡니다.
            // markQuizCompleted 함수가 .completed 클래스를 관리합니다.
        } else if (quizId === nextQuizId) {
            // 바로 다음에 풀어야 할 퀴즈는 강조 효과를 줍니다.
            element.classList.add('unlocked-glowing');
        } else {
            // 아직 풀 수 없는 미래의 퀴즈는 잠금 처리합니다.
            element.classList.add('locked');
        }
    });
}


/**
 * 클릭 가능한 오브젝트에 이벤트 리스너를 설정합니다.
 * 게임이 처음 로드될 때 한 번만 호출됩니다.
 */
function initializeClickables() {
    const clickables = document.querySelectorAll('.clickable');
    clickables.forEach(el => {
        el.addEventListener('click', handleObjectClick);
    });
}

/**
 * 오브젝트 클릭 이벤트를 처리하는 핸들러입니다.
 * @param {MouseEvent} event - 클릭 이벤트 객체
 */
function handleObjectClick(event) {
    const target = event.currentTarget;

    // 잠긴 오브젝트를 클릭한 경우
    if (target.classList.contains('locked')) {
        showMessage("이전 퀴즈를 먼저 풀어주세요!");
        playClickSound(); // 잠겼을 때도 소리 피드백
        
        // 흔들리는 애니메이션 효과 추가
        target.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            target.style.animation = '';
        }, 500);
        return;
    }

    // 잠기지 않은 경우(다음에 풀 퀴즈 또는 이미 푼 퀴즈)
    const quizId = parseInt(target.dataset.quizId, 10);
    if (quizId) {
        openQuiz(quizId); // openQuiz 함수는 내부적으로 완료/미완료 상태를 처리
    }
}


// 사운드 초기화 및 로드
function initializeSounds() {
    try {
        // 배경음악 초기화 (엔딩용)
        backgroundMusic = new Audio('sounds/ending_music.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.6;
        
        // 클릭 사운드 초기화
        clickSound = new Audio('sounds/click_sound.mp3');
        clickSound.volume = 0.8;
        
        // 사운드 사전 로드
        const loadPromises = [
            new Promise((resolve, reject) => {
                backgroundMusic.addEventListener('canplaythrough', resolve, { once: true });
                backgroundMusic.addEventListener('error', reject, { once: true });
                backgroundMusic.load();
            }),
            new Promise((resolve, reject) => {
                clickSound.addEventListener('canplaythrough', resolve, { once: true });
                clickSound.addEventListener('error', reject, { once: true });
                clickSound.load();
            })
        ];
        
        Promise.all(loadPromises).then(() => {
            soundsLoaded = true;
            console.log('모든 사운드가 성공적으로 로드되었습니다.');
        }).catch(error => {
            console.log('사운드 로드 중 오류 발생:', error);
            soundsLoaded = false;
        });
        
    } catch (error) {
        console.log('사운드 초기화 실패:', error);
        soundsLoaded = false;
    }
}

// 클릭 사운드 재생
function playClickSound() {
    if (soundsLoaded && clickSound) {
        try {
            clickSound.currentTime = 0; // 사운드를 처음부터 재생
            clickSound.play().catch(error => {
                console.log('클릭 사운드 재생 실패:', error);
            });
        } catch (error) {
            console.log('클릭 사운드 재생 중 오류:', error);
        }
    }
}

// 배경음악 재생
function playBackgroundMusic() {
    if (soundsLoaded && backgroundMusic) {
        try {
            backgroundMusic.currentTime = 0;
            backgroundMusic.play().catch(error => {
                console.log('배경음악 재생 실패:', error);
            });
        } catch (error) {
            console.log('배경음악 재생 중 오류:', error);
        }
    }
}

// 배경음악 중지
function stopBackgroundMusic() {
    if (backgroundMusic) {
        try {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        } catch (error) {
            console.log('배경음악 중지 중 오류:', error);
        }
    }
}

// ▼▼▼ 스토리 모달 관련 함수 추가 ▼▼▼
/**
 * 방에 처음 진입했을 때 스토리 모달을 보여줍니다.
 * @param {number} roomNum - 현재 방 번호
 */
function showStoryModal(roomNum) {
    // 이미 본 스토리면 바로 게임 시작
    if (shownStories.includes(roomNum)) {
        startRoomTimer();
        updateClickableStates();
        return;
    }

    const story = roomStories[roomNum];
    if (story) {
        document.getElementById('storyTitle').textContent = story.title;
        document.getElementById('storyText').textContent = story.text;
        document.getElementById('storyModal').style.display = 'flex';
    } else {
        // 스토리가 없는 경우 (예외 처리)
        startChallenge();
    }
}

/**
 * '탈출 도전' 버튼 클릭 시 실행되는 함수
 */
function startChallenge() {
    document.getElementById('storyModal').style.display = 'none';
    
    // 스토리를 봤다고 기록
    if (!shownStories.includes(currentRoom)) {
        shownStories.push(currentRoom);
        localStorage.setItem('shownStories', JSON.stringify(shownStories));
    }
    
    // 타이머 시작 및 오브젝트 활성화
    startRoomTimer();
    updateClickableStates();
}
// ▲▲▲ 스토리 모달 관련 함수 추가 ▲▲▲


// 게임 시작 - 비디오 전환 포함 (스토리 모달 호출로 수정)
function startGame() {
    requestFullScreen(); // ✨ 시작 시 전체화면 요청
    console.log('게임 시작 버튼 클릭됨');
    
    // 비디오 전환 사용 (텍스트 없이)
    showTransitionWithVideo('start', () => {
        document.getElementById('startScreen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'block';
            setTimeout(() => {
                document.getElementById('gameScreen').classList.add('active');
                loadGameState();
                updateUI();
                // 스토리 모달을 보여주고, 모달이 닫히면 게임이 시작됨
                showStoryModal(currentRoom); 
            }, 50);
        }, 800);
    });
}


// ✨ 게임 이어하기 함수 (타이머 직접 시작으로 수정) ✨
function requestFullScreenAndResume() {
    requestFullScreen(); // 전체화면 요청
    
    // 화면 전환
    const resumeScreen = document.getElementById('resumeScreen');
    resumeScreen.style.transition = 'opacity 0.5s ease';
    resumeScreen.style.opacity = '0';
    
    setTimeout(() => {
        resumeScreen.style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        setTimeout(() => {
            document.getElementById('gameScreen').classList.add('active');
            loadGameState();
            updateUI();
            // 이어하기는 스토리 없이 바로 시작
            updateClickableStates(); 
            startRoomTimer(); 
        }, 50);
    }, 500);
}


// 타이머 초기화
function initTimer() {
    // Web Audio API를 사용해 똑딱 소리 생성
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        function createTickSound() {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
        
        tickSound = createTickSound;
    } catch (error) {
        console.log('오디오 컨텍스트 생성 실패:', error);
        tickSound = null;
    }
}

// 방 타이머 시작
function startRoomTimer() {
    if (isTimerActive) return;
    
    timeLeft = 420; // 7분 리셋
    isTimerActive = true;
    updateTimerDisplay();
    initTimer();
    
    roomTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        // 똑딱 소리 재생 (마지막 2분)
        if (timeLeft <= 120 && tickSound) {
            try {
                tickSound();
            } catch (error) {
                console.log('똑딱 소리 재생 실패:', error);
            }
        }
        
        // 시간 경고
        if (timeLeft === 120) { // 2분 남음
            showTimerWarning();
        }
        
        // 시간 종료
        if (timeLeft <= 0) {
            gameOver();
        }
    }, 1000);
}

// 타이머 중지
function stopRoomTimer() {
    if (roomTimer) {
        clearInterval(roomTimer);
        roomTimer = null;
    }
    isTimerActive = false;
    hideTimerWarning();
}

// 타이머 디스플레이 업데이트
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('timer');
    timerElement.textContent = display;
    
    // 타이머 색상 변경
    timerElement.classList.remove('warning', 'danger');
    
    if (timeLeft <= 60) { // 1분 이하
        timerElement.classList.add('danger');
    } else if (timeLeft <= 120) { // 2분 이하
        timerElement.classList.add('warning');
    }
}

// 타이머 경고 표시
function showTimerWarning() {
    const warningElement = document.getElementById('timerWarning');
    warningElement.style.display = 'block';
    
    setTimeout(() => {
        hideTimerWarning();
    }, 5000); // 5초 후 숨김
}

// 타이머 경고 숨김
function hideTimerWarning() {
    const warningElement = document.getElementById('timerWarning');
    warningElement.style.display = 'none';
}

// 게임오버
function gameOver() {
    stopRoomTimer();
    stopBackgroundMusic(); // 배경음악 중지
    
    // 모든 화면 숨김
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('endingScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
    
    // 게임오버 화면 표시
    document.getElementById('gameOverScreen').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('gameOverScreen').classList.add('active');
    }, 100);
    
    // 모달 닫기
    closeModal();
}

// 게임 상태 로드
function loadGameState() {
    const savedRoom = localStorage.getItem('currentRoom');
    if (savedRoom) {
        currentRoom = parseInt(savedRoom);
        showRoom(currentRoom);
    }
    
    completedQuizzes.forEach(quizId => {
        markQuizCompleted(quizId);
    });
    
    checkRoomCompletion();
}

// 퀴즈 열기 - 완료된 퀴즈도 열람 가능하도록 수정 + 클릭 사운드 추가
function openQuiz(quizId) {
    // 클릭 사운드 재생
    playClickSound();
    
    currentQuiz = quizId;
    const quiz = quizzes[quizId];
    const isCompleted = completedQuizzes.includes(quizId);
    
    // 👈 여기에 퀴즈별 모달 크기 설정 추가
    const modalContent = document.querySelector('#quizModal .modal-content');
    
    // 퀴즈 타입별로 크기 다르게 설정
    if (quiz.type === 'matching' || quiz.type === 'word_sort' || quiz.type === 'word_classification') {
        modalContent.style.maxWidth = '1300px';  // 복잡한 퀴즈는 크게
        modalContent.style.width = '95%';
    } else if (quiz.type === 'four') {
        modalContent.style.maxWidth = '1000px';   // 4개 입력은 중간
        modalContent.style.width = '95%';
    } else if (quiz.type === 'single' || quiz.type === 'password') {
        modalContent.style.maxWidth = '1000px';   // 단일 입력은 작게
        modalContent.style.width = '95%';
    } else {
        modalContent.style.maxWidth = '1000px';   // 기본 크기
        modalContent.style.width = '95%';
    }
    
    document.getElementById('quizTitle').style.display = 'none';
    document.getElementById('quizTitle').textContent = quiz.title;
    document.getElementById('quizQuestion').innerHTML = quiz.question;
    
    // 완료된 퀴즈인 경우 정답과 함께 표시
    if (isCompleted) {
        createCompletedQuizDisplay(quiz);
    } else {
        createQuizInput(quiz.type);
    }
    
    document.getElementById('quizModal').style.display = 'flex';
}

// 완료된 퀴즈 표시 함수
function createCompletedQuizDisplay(quiz) {
    const inputContainer = document.getElementById('quizInput');
    inputContainer.innerHTML = '';
    
    // 정답 표시 컨테이너 생성
    const answerContainer = document.createElement('div');
    answerContainer.className = 'completed-quiz-display';
    
    // 정답 제목
    const answerTitle = document.createElement('h4');
    answerTitle.textContent = '✅ 정답:';
    answerTitle.style.color = '#00ff00';
    answerTitle.style.marginBottom = '15px';
    answerTitle.style.fontSize = '1.5rem';
    answerContainer.appendChild(answerTitle);
    
    // 정답 내용 표시
    if (quiz.type === 'matching') {
        // 매칭 퀴즈 정답 표시
        const matchingAnswerContainer = document.createElement('div');
        matchingAnswerContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            margin-bottom: 20px;
        `;
        
        Object.entries(quiz.correctMatches).forEach(([period, law]) => {
            const matchItem = document.createElement('div');
            matchItem.style.cssText = `
                background: rgba(0,255,0,0.1);
                border: 2px solid #00ff00;
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                font-size: 1.2rem;
                color: #00ff00;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            matchItem.innerHTML = `
                <span>${period}</span>
                <span style="color: #ffd700;">➜</span>
                <span>${law}</span>
            `;
            matchingAnswerContainer.appendChild(matchItem);
        });
        
        answerContainer.appendChild(matchingAnswerContainer);
    } else if (quiz.type === 'word_sort') {
        // 단어 정렬 퀴즈 정답 표시
        const correctSentence = quiz.correctOrder.join(' ');
        const answerBox = document.createElement('div');
        answerBox.className = 'completed-answer-box';
        answerBox.style.background = 'rgba(0,255,0,0.1)';
        answerBox.style.border = '2px solid #00ff00';
        answerBox.style.borderRadius = '8px';
        answerBox.style.padding = '15px';
        answerBox.style.textAlign = 'center';
        answerBox.style.fontSize = '1.5rem';
        answerBox.style.color = '#00ff00';
        answerBox.style.fontWeight = 'bold';
        answerBox.style.wordBreak = 'keep-all';
        answerBox.style.lineHeight = '1.4';
        answerBox.textContent = `"${correctSentence}"`;
        answerContainer.appendChild(answerBox);
    } else if (quiz.type === 'word_classification') {
        // 단어 분류 퀴즈 정답 표시 추가
        const classificationContainer = document.createElement('div');
        classificationContainer.style.cssText = `
            display: flex;
            justify-content: space-around;
            gap: 20px;
            margin-bottom: 20px;
        `;

        Object.entries(quiz.correctClassification).forEach(([category, words]) => {
            const categoryBox = document.createElement('div');
            categoryBox.style.cssText = `
                flex: 1;
                background: rgba(0,255,0,0.1);
                border: 2px solid #00ff00;
                border-radius: 8px;
                padding: 15px;
            `;

            const categoryTitle = document.createElement('h5');
            categoryTitle.textContent = category;
            categoryTitle.style.cssText = `
                color: #00ff00;
                font-size: 1.4rem;
                text-align: center;
                margin-bottom: 10px;
            `;
            categoryBox.appendChild(categoryTitle);

            words.forEach(word => {
                const wordItem = document.createElement('div');
                wordItem.textContent = word;
                wordItem.style.cssText = `
                    background: rgba(0,255,0,0.2);
                    padding: 8px;
                    text-align: center;
                    border-radius: 5px;
                    margin-top: 5px;
                    font-size: 1.2rem;
                    color: #fff;
                `;
                categoryBox.appendChild(wordItem);
            });
            classificationContainer.appendChild(categoryBox);
        });
        answerContainer.appendChild(classificationContainer);
    } else if (quiz.type === 'four') {
        // 4개 정답인 경우
        const answersGrid = document.createElement('div');
        answersGrid.className = 'completed-answers-grid';
        answersGrid.style.display = 'grid';
        answersGrid.style.gridTemplateColumns = '1fr 1fr';
        answersGrid.style.gap = '10px';
        answersGrid.style.marginBottom = '20px';
        
        quiz.answers.forEach((answer, index) => {
            const answerBox = document.createElement('div');
            answerBox.className = 'completed-answer-box';
            answerBox.style.background = 'rgba(0,255,0,0.1)';
            answerBox.style.border = '2px solid #00ff00';
            answerBox.style.borderRadius = '8px';
            answerBox.style.padding = '10px';
            answerBox.style.textAlign = 'center';
            answerBox.style.fontSize = '1.3rem';
            answerBox.style.color = '#00ff00';
            answerBox.style.fontWeight = 'bold';
            answerBox.textContent = `${index + 1}. ${answer}`;
            answersGrid.appendChild(answerBox);
        });
        
        answerContainer.appendChild(answersGrid);
    } else {
        // 단일 정답인 경우
        const answerBox = document.createElement('div');
        answerBox.className = 'completed-answer-box';
        answerBox.style.background = 'rgba(0,255,0,0.1)';
        answerBox.style.border = '2px solid #00ff00';
        answerBox.style.borderRadius = '8px';
        answerBox.style.padding = '15px';
        answerBox.style.textAlign = 'center';
        answerBox.style.fontSize = '1.8rem';
        answerBox.style.color = '#00ff00';
        answerBox.style.fontWeight = 'bold';
        answerBox.style.wordBreak = 'keep-all';
        answerBox.style.lineHeight = '1.4';
        answerBox.textContent = quiz.answers[0];
        answerContainer.appendChild(answerBox);
    }
    
    // 완료 표시
    const completedMessage = document.createElement('p');
    completedMessage.textContent = '이미 완료된 퀴즈입니다. 참고용으로 정답을 확인할 수 있습니다.';
    completedMessage.style.color = '#ffd700';
    completedMessage.style.textAlign = 'center';
    completedMessage.style.fontStyle = 'italic';
    completedMessage.style.marginTop = '15px';
    completedMessage.style.fontSize = '1.1rem';
    answerContainer.appendChild(completedMessage);
    
    inputContainer.appendChild(answerContainer);
    
    // 버튼 영역 수정
    const submitBtn = document.querySelector('#quizModal .submit-btn');
    const closeBtn = document.querySelector('#quizModal .close-btn');
    
    if (submitBtn) {
        submitBtn.style.display = 'none'; // 확인 버튼 숨기기
    }
    
    if (closeBtn) {
        closeBtn.textContent = '확인';
        closeBtn.style.background = 'linear-gradient(45deg, #4caf50, #2e7d32)';
    }
}


// 새로운 함수: 단어 분류 게임 생성 (4번 퀴즈용)
function createWordClassificationGame() {
    const inputContainer = document.getElementById('quizInput');
    inputContainer.innerHTML = '';

    const quiz = quizzes[currentQuiz];

    // 게임 컨테이너 생성
    const gameContainer = document.createElement('div');
    gameContainer.className = 'word-classification-container';

    // 1. 분류되지 않은 단어 영역
    const unclassifiedContainer = document.createElement('div');
    unclassifiedContainer.className = 'unclassified-words-container';
    
    const instructionText = document.createElement('p');
    instructionText.textContent = '아래 단어들을 알맞은 곳으로 옮기세요.';
    instructionText.style.cssText = `
        text-align: center;
        color: #ffd700;
        font-size: 1.2rem;
        width: 100%;
        margin-bottom: 15px;
    `;
    unclassifiedContainer.appendChild(instructionText);

    // 단어 요소들 생성 (섞어서)
    const shuffledWords = [...quiz.words].sort(() => Math.random() - 0.5);
    shuffledWords.forEach((word, index) => {
        const wordElement = createWordElement(word, index); // 기존 함수 재활용
        unclassifiedContainer.appendChild(wordElement);
    });

    // 2. 분류 영역 (드롭존)
    const dropZonesContainer = document.createElement('div');
    dropZonesContainer.className = 'drop-zones-container';

    quiz.categories.forEach(category => {
        const dropZone = document.createElement('div');
        dropZone.className = 'category-drop-zone';
        dropZone.dataset.category = category;

        const title = document.createElement('h3');
        title.textContent = category;
        dropZone.appendChild(title);
        
        dropZonesContainer.appendChild(dropZone);
    });

    // 컨테이너 조립
    gameContainer.appendChild(unclassifiedContainer);
    gameContainer.appendChild(dropZonesContainer);
    inputContainer.appendChild(gameContainer);

    // 드롭 영역 설정 (unclassified 포함 3개)
    setupDropZones(unclassifiedContainer, ...dropZonesContainer.querySelectorAll('.category-drop-zone'));
}


// =================================================================
// ✨ 4번 문제 정답 확인 로직 수정 ✨
// =================================================================
function checkWordClassificationCompletion() {
    const quiz = quizzes[currentQuiz];
    const unclassifiedContainer = document.querySelector('.unclassified-words-container');

    // 아직 옮겨야 할 단어가 남아있으면 확인하지 않음 (p 태그는 제외하고 계산)
    if (unclassifiedContainer.querySelectorAll('.word-element').length > 0) {
        return;
    }

    let allCorrect = true;
    document.querySelectorAll('.category-drop-zone').forEach(zone => {
        const category = zone.dataset.category;
        const correctWordsForCategory = quiz.correctClassification[category];
        const wordsInZone = Array.from(zone.querySelectorAll('.word-element')).map(el => el.dataset.word);

        if (wordsInZone.length !== correctWordsForCategory.length) {
            allCorrect = false;
        } else {
            for (const word of wordsInZone) {
                if (!correctWordsForCategory.includes(word)) {
                    allCorrect = false;
                    break;
                }
            }
        }
    });

    // 모든 단어가 올바른 위치에 놓였을 때만 실행
    if (allCorrect) {
        // 정답 시각적 효과 (7번 문제와 동일하게)
        const wordElements = document.querySelectorAll('.category-drop-zone .word-element');
        wordElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
                el.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    el.style.transform = 'scale(1)';
                }, 200);
            }, index * 100);
        });
        
        // 애니메이션이 끝난 후 정답 처리
        setTimeout(() => {
            correctAnswer();
        }, wordElements.length * 100 + 500);
    }
    // 오답일 경우: 아무런 메시지나 효과 없이 사용자가 재배치하도록 둡니다.
}
// =================================================================


// 매칭 게임 생성
function createMatchingGame() {
    const inputContainer = document.getElementById('quizInput');
    inputContainer.innerHTML = '';
    
    const quiz = quizzes[currentQuiz];
    
    // 게임 컨테이너 생성
    const gameContainer = document.createElement('div');
    gameContainer.className = 'matching-game-container';
    gameContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 50px 1fr;
        gap: 20px;
        max-width: 1200px;
        margin: 0 auto;
        align-items: start;
    `;
    
    // 좌측 시대 컨테이너
    const periodsContainer = document.createElement('div');
    periodsContainer.className = 'periods-container';
    periodsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    
    // 중앙 화살표 컨테이너
    const arrowContainer = document.createElement('div');
    arrowContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding-top: 20px;
    `;
    
    // 우측 법 컨테이너
    const lawsContainer = document.createElement('div');
    lawsContainer.className = 'laws-container';
    lawsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    
   // 오른쪽 선택지 순서를 섞어줍니다.
    const shuffledLaws = [...quiz.laws].sort(() => Math.random() - 0.5);
    
    // 시대 요소들 생성
    quiz.periods.forEach((period, index) => {
        const periodItem = document.createElement('div');
        periodItem.className = 'period-item';
        periodItem.dataset.period = period;
        periodItem.textContent = period;
        
        periodItem.style.cssText = `
            background: linear-gradient(135deg, #8e24aa, #5e35b1);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-weight: bold;
            text-align: center;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.3s ease;
            font-size: 1.2rem;
        `;
        
        periodItem.addEventListener('click', () => selectPeriod(periodItem));
        periodsContainer.appendChild(periodItem);
    });
    
    // 법 요소들 생성 (섞인 순서로)
    shuffledLaws.forEach((law, index) => {
        const lawItem = document.createElement('div');
        lawItem.className = 'law-item';
        lawItem.dataset.law = law;
        lawItem.textContent = law;
        
        lawItem.style.cssText = `
            background: linear-gradient(135deg, #4a90e2, #357abd);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-weight: bold;
            text-align: center;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.3s ease;
            font-size: 1.2rem;
        `;
        
        lawItem.addEventListener('click', () => selectLaw(lawItem));
        lawsContainer.appendChild(lawItem);
    });
    
    
    // 컨테이너 조립
    gameContainer.appendChild(periodsContainer);
    gameContainer.appendChild(arrowContainer);
    gameContainer.appendChild(lawsContainer);
    
    inputContainer.appendChild(gameContainer);
    
    // 전역 변수 초기화
    window.selectedPeriod = null;
    window.currentMatches = {};
    window.correctMatches = quiz.correctMatches;
}

// 단어 정렬 게임 생성
function createWordSortGame() {
    const inputContainer = document.getElementById('quizInput');
    inputContainer.innerHTML = '';
    
    const quiz = quizzes[currentQuiz];
    
    // 게임 컨테이너 생성
    const gameContainer = document.createElement('div');
    gameContainer.className = 'word-sort-game-container';
    gameContainer.style.cssText = `
        max-width: 900px;
        margin: 0 auto;
    `;
    
    // 설명 텍스트
    const instructionText = document.createElement('p');
    instructionText.textContent = '단어를 드래그하여 올바른 순서로 배열하세요.';
    instructionText.style.cssText = `
        text-align: center;
        color: #ffd700;
        font-size: 1.2rem;
        margin-bottom: 30px;
        font-style: italic;
    `;
    
    // 뒤섞인 단어들 컨테이너
    const shuffledContainer = document.createElement('div');
    shuffledContainer.className = 'shuffled-words-container';
    shuffledContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 20px;
        background: rgba(0,0,0,0.3);
        border-radius: 15px;
        margin-bottom: 30px;
        border: 2px solid #6a1b9a;
        min-height: 100px;
        justify-content: center;
        align-items: flex-start;
        width: 100%;
    `;
    
    // 정답 영역 컨테이너
    const answerContainer = document.createElement('div');
    answerContainer.className = 'answer-words-container';
    answerContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 30px;
        background: rgba(0,100,0,0.2);
        border-radius: 15px;
        border: 2px dashed #4caf50;
        min-height: 120px;
        align-items: flex-start;
        justify-content: center;
        width: 100%
   `;
   
   
   // 단어 요소들 생성 (섞인 순서로)
   const shuffledWords = [...quiz.shuffledWords].sort(() => Math.random() - 0.5);
   
   shuffledWords.forEach((word, index) => {
       const wordElement = createWordElement(word, index);
       shuffledContainer.appendChild(wordElement);
   });
   
   // 컨테이너 조립
   gameContainer.appendChild(instructionText);
   gameContainer.appendChild(shuffledContainer);
   gameContainer.appendChild(answerContainer);
   
   inputContainer.appendChild(gameContainer);
   
   // 드롭 영역 설정
   setupDropZones(shuffledContainer, answerContainer);
   
   // 전역 변수 초기화
   window.currentWordOrder = [];
   window.correctWordOrder = quiz.correctOrder;
}

// 단어 요소 생성
function createWordElement(word, index) {
   const wordElement = document.createElement('div');
   wordElement.className = 'word-element';
   wordElement.dataset.word = word;
   wordElement.dataset.index = index;
   wordElement.textContent = word;
   wordElement.draggable = true;
   
   wordElement.style.cssText = `
       background: linear-gradient(135deg, #4a90e2, #357abd);
       color: white;
       padding: 10px 20px;
       border-radius: 8px;
       cursor: grab;
       user-select: none;
       font-weight: bold;
       font-size: 1.5rem;
       border: 2px solid transparent;
       transition: all 0.3s ease;
       box-shadow: 0 2px 5px rgba(0,0,0,0.2);
   `;
   
   // 드래그 이벤트 리스너
   wordElement.addEventListener('dragstart', handleDragStart);
   wordElement.addEventListener('dragend', handleDragEnd);
   
   // 모바일 터치 지원
   wordElement.addEventListener('touchstart', handleTouchStart, { passive: false });
   wordElement.addEventListener('touchmove', handleTouchMove, { passive: false });
   wordElement.addEventListener('touchend', handleTouchEnd, { passive: false });
   
   return wordElement;
}

// 드롭 영역 설정 (가변 인자 ...containers 사용)
function setupDropZones(...containers) {
   containers.forEach(container => {
       if (container) {
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('drop', handleDrop);
       }
   });
}


// 드래그 시작
function handleDragStart(e) {
   // 드래그하는 요소의 원래 인덱스를 데이터로 전달
   e.dataTransfer.setData('text/plain', e.target.dataset.index);
   e.target.classList.add('dragging'); // Use class for visual feedback
}

// 드래그 종료
function handleDragEnd(e) {
   e.target.classList.remove('dragging');
}


// 드래그 오버
function handleDragOver(e) {
   e.preventDefault();
   // 드롭 영역에 따라 다른 배경색 피드백
   if (e.currentTarget.classList.contains('answer-words-container') || e.currentTarget.classList.contains('category-drop-zone')) {
        e.currentTarget.style.background = 'rgba(0,150,0,0.3)';
   } else {
        e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
   }
}

// 드롭 처리
function handleDrop(e) {
    e.preventDefault();
    const draggedIndex = e.dataTransfer.getData('text/plain');
    const draggedElement = document.querySelector(`.word-element[data-index='${draggedIndex}']`);
    
    if (draggedElement && e.currentTarget !== draggedElement.parentNode) {
        // p 태그는 옮겨지지 않도록 예외 처리
        if (draggedElement.tagName.toLowerCase() !== 'p') {
            e.currentTarget.appendChild(draggedElement);
        }
        
        // 현재 퀴즈 타입에 따라 다른 완료 체크 함수 호출
        const quizType = quizzes[currentQuiz].type;
        if (quizType === 'word_sort') {
            checkWordSortCompletion();
        } else if (quizType === 'word_classification') {
            checkWordClassificationCompletion();
        }
    }
    
    // 배경색 복원
    resetDropZoneBackground(e.currentTarget);
}

// 드롭 영역 배경색 복원
function resetDropZoneBackground(container) {
    if (container.classList.contains('answer-words-container') || container.classList.contains('category-drop-zone')) {
        container.style.background = 'rgba(0,100,0,0.2)';
    } else if (container.classList.contains('unclassified-words-container')) {
        container.style.background = 'rgba(0,0,0,0.3)';
    } else {
        container.style.background = 'rgba(0,0,0,0.3)';
    }
}


// === ✨ 터치 이벤트 핸들러 개선 ✨ ===
let draggedTouchElement = null;
let touchOffsetX = 0;
let touchOffsetY = 0;

function handleTouchStart(e) {
    e.preventDefault();
    draggedTouchElement = e.target;
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();

    // 터치가 요소의 어디에서 시작되었는지 계산
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;

    // 드래그 중인 요소에 스타일 적용
    draggedTouchElement.classList.add('touch-dragging');
    // 초기 위치 설정 (깜빡임 방지)
    draggedTouchElement.style.left = `${rect.left}px`;
    draggedTouchElement.style.top = `${rect.top}px`;

    // 드래그 중 페이지 스크롤 방지
    document.body.style.overflow = 'hidden';
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!draggedTouchElement) return;
    
    const touch = e.touches[0];
    // 터치 위치에 따라 요소 위치 업데이트
    const x = touch.clientX - touchOffsetX;
    const y = touch.clientY - touchOffsetY;
    draggedTouchElement.style.left = `${x}px`;
    draggedTouchElement.style.top = `${y}px`;
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!draggedTouchElement) return;

    const touch = e.changedTouches[0];

    // 드롭 위치의 요소를 찾기 위해 잠시 숨김
    draggedTouchElement.style.display = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    draggedTouchElement.style.display = '';

    // 가장 가까운 드롭 컨테이너 찾기
    const dropContainer = elementBelow?.closest('.shuffled-words-container, .answer-words-container, .category-drop-zone, .unclassified-words-container');

    // 스타일 초기화
    draggedTouchElement.classList.remove('touch-dragging');
    draggedTouchElement.style.left = '';
    draggedTouchElement.style.top = '';
    document.body.style.overflow = ''; // 페이지 스크롤 복원

    if (dropContainer && dropContainer !== draggedTouchElement.parentNode) {
        if (draggedTouchElement.tagName.toLowerCase() !== 'p') {
            dropContainer.appendChild(draggedTouchElement);
        }
        
        // 퀴즈 완료 여부 확인
        const quizType = quizzes[currentQuiz].type;
        if (quizType === 'word_sort') {
            checkWordSortCompletion();
        } else if (quizType === 'word_classification') {
            checkWordClassificationCompletion();
        }
    }

    draggedTouchElement = null;
}
// ===================================


// 단어 정렬 완료 확인
function checkWordSortCompletion() {
   const answerContainer = document.querySelector('.answer-words-container');
   const wordsInAnswer = Array.from(answerContainer.querySelectorAll('.word-element'))
       .map(el => el.dataset.word);
   
   // 모든 단어가 정답 영역에 있는지 확인
   if (wordsInAnswer.length === window.correctWordOrder.length) {
       // 순서가 맞는지 확인
       const isCorrectOrder = wordsInAnswer.every((word, index) => 
           word === window.correctWordOrder[index]
       );
       
       if (isCorrectOrder) {
           // 정답 시각적 효과
           const wordElements = answerContainer.querySelectorAll('.word-element');
           wordElements.forEach((el, index) => {
               setTimeout(() => {
                   el.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
                   el.style.transform = 'scale(1.05)';
                   setTimeout(() => {
                       el.style.transform = 'scale(1)';
                   }, 200);
               }, index * 100);
           });
           
           setTimeout(() => {
               correctAnswer();
           }, wordsInAnswer.length * 100 + 500);
       }
   }
}

// 시대 선택
function selectPeriod(periodElement) {
   // 이전 선택 해제
   document.querySelectorAll('.period-item').forEach(item => {
       item.style.borderColor = 'transparent';
       item.style.boxShadow = 'none';
   });
   
   // 새로운 선택
   window.selectedPeriod = periodElement.dataset.period;
   periodElement.style.borderColor = '#ffd700';
   periodElement.style.boxShadow = '0 0 15px rgba(255,215,0,0.6)';
}

// 법 선택 및 매칭
function selectLaw(lawElement) {
   if (!window.selectedPeriod) {
       showMessage("먼저 품사를 선택해주세요!");
       return;
   }
   
   const selectedLaw = lawElement.dataset.law;
   
   // 매칭 처리
   window.currentMatches[window.selectedPeriod] = selectedLaw;
   
   // 시각적 피드백
   const isCorrect = window.correctMatches[window.selectedPeriod] === selectedLaw;
   
   if (isCorrect) {
       // 정답인 경우
       lawElement.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
       lawElement.style.borderColor = '#00ff00';
       lawElement.style.pointerEvents = 'none'; // 다시 선택 불가
       
       // 해당 시대도 녹색으로
       const periodElement = document.querySelector(`[data-period="${window.selectedPeriod}"]`);
       periodElement.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
       periodElement.style.borderColor = '#00ff00';
       periodElement.style.pointerEvents = 'none'; // 다시 선택 불가
       
       // 연결선 효과 (선택사항)
       createConnectionLine(periodElement, lawElement);
   } else {
       // 오답인 경우
       lawElement.style.background = 'linear-gradient(135deg, #f44336, #c62828)';
       setTimeout(() => {
           lawElement.style.background = 'linear-gradient(135deg, #4a90e2, #357abd)';
       }, 1000);
       
       delete window.currentMatches[window.selectedPeriod];
   }
   
   // 선택 상태 초기화
   document.querySelectorAll('.period-item').forEach(item => {
       if (!item.style.pointerEvents || item.style.pointerEvents === 'auto') {
            item.style.borderColor = 'transparent';
            item.style.boxShadow = 'none';
       }
   });
   window.selectedPeriod = null;
   
   // 모든 매칭 완료 확인
   if (Object.keys(window.currentMatches).length === 5) {
       setTimeout(() => {
           checkMatchingComplete();
       }, 500);
   }
}

// 연결선 생성 (시각적 효과)
function createConnectionLine(periodElement, lawElement) {
   // 간단한 연결 표시 - 체크마크로 대체
   const checkMark = document.createElement('div');
   checkMark.textContent = '✓';
   checkMark.style.cssText = `
       position: absolute;
       top: 50%;
       left: 50%;
       transform: translate(-50%, -50%);
       color: #00ff00;
       font-size: 2rem;
       font-weight: bold;
       z-index: 100;
       animation: checkmarkPop 0.5s ease-out;
       pointer-events: none;
   `;
   
   periodElement.style.position = 'relative';
   periodElement.appendChild(checkMark);
   
   // 애니메이션 키프레임 추가
   if (!document.querySelector('#checkmarkAnimation')) {
       const style = document.createElement('style');
       style.id = 'checkmarkAnimation';
       style.textContent = `
           @keyframes checkmarkPop {
               0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
               50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
               100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
           }
       `;
       document.head.appendChild(style);
   }
}

// 매칭 완료 확인
function checkMatchingComplete() {
   let allCorrect = true;
   
   for (const [period, law] of Object.entries(window.currentMatches)) {
       if (window.correctMatches[period] !== law) {
           allCorrect = false;
           break;
       }
   }
   
   if (allCorrect && Object.keys(window.currentMatches).length === 5) {
       correctAnswer();
   }
}

// 퀴즈 입력 필드 생성
function createQuizInput(type) {
   const inputContainer = document.getElementById('quizInput');
   inputContainer.innerHTML = '';
   
   if (type === 'single' || type === 'password') {
       const input = document.createElement('input');
       input.type = 'text';
       input.id = 'quizAnswer';
       input.placeholder = '정답을 입력하세요...';
       input.addEventListener('keypress', function(e) {
           if (e.key === 'Enter') checkAnswer();
       });
       inputContainer.appendChild(input);
       setTimeout(() => input.focus(), 100);
   } else if (type === 'four') {
       const container = document.createElement('div');
       container.className = 'four-inputs';
       for (let i = 1; i <= 4; i++) {
           const input = document.createElement('input');
           input.type = 'text';
           input.id = `answer${i}`;
           input.placeholder = `${i}번 정답`;
           input.addEventListener('keypress', function(e) {
               if (e.key === 'Enter') checkAnswer();
           });
           container.appendChild(input);
       }
       inputContainer.appendChild(container);
       setTimeout(() => document.getElementById('answer1').focus(), 100);
   } else if (type === 'matching') {
       createMatchingGame();
   } else if (type === 'word_sort') {
       createWordSortGame();
   } else if (type === 'word_classification') { // 새 퀴즈 유형 추가
       createWordClassificationGame();
   } else if (type === 'textarea') {
       const textarea = document.createElement('textarea');
       textarea.id = 'quizAnswer';
       textarea.placeholder = '정답을 정확히 입력하세요...';
       textarea.addEventListener('keypress', function(e) {
           if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               checkAnswer();
           }
       });
       inputContainer.appendChild(textarea);
       setTimeout(() => textarea.focus(), 100);
   }
   
   // 버튼 영역 원상복구
   const submitBtn = document.querySelector('#quizModal .submit-btn');
   const closeBtn = document.querySelector('#quizModal .close-btn');
   
   if (submitBtn) {
       submitBtn.style.display = 'inline-block';
   }
   
   if (closeBtn) {
       closeBtn.textContent = '닫기';
       closeBtn.style.background = 'linear-gradient(45deg, #f44336, #c62828)';
   }
}

// 정답 확인 - 마지막 퀴즈(12번) 처리 수정
function checkAnswer() {
   const quiz = quizzes[currentQuiz];
   let userAnswer = '';
   
    // 드래그 앤 드롭 퀴즈는 자동 체크되므로 여기서는 처리하지 않음
   if (quiz.type === 'matching' || quiz.type === 'word_sort' || quiz.type === 'word_classification') {
       return;
   } else if (quiz.type === 'four') {
       const answers = [];
       for (let i = 1; i <= 4; i++) {
           const value = document.getElementById(`answer${i}`).value.trim();
           answers.push(value);
       }
       
       const correctAnswers = quiz.answers;
       let isCorrect = true;
       
       for (let i = 0; i < 4; i++) {
           if (normalizeAnswer(answers[i]) !== normalizeAnswer(correctAnswers[i])) {
               isCorrect = false;
               break;
           }
       }
       
       if (isCorrect) {
           correctAnswer();
       } else {
           wrongAnswer();
       }
       return;
   } else {
       userAnswer = document.getElementById('quizAnswer').value.trim();
   }
   
   const normalizedAnswer = normalizeAnswer(userAnswer);
   const isCorrect = quiz.answers.some(answer => 
       normalizeAnswer(answer) === normalizedAnswer
   );
   
   if (isCorrect) {
       // 마지막 퀴즈(12번)인 경우 특별한 처리
       if (currentQuiz === 12) {
           correctAnswerForFinalQuiz();
       } else {
           correctAnswer();
       }
   } else {
       wrongAnswer();
   }
}

// 마지막 퀴즈 정답 처리 - 수정됨 (축하 메시지 제거, 바로 엔딩)
function correctAnswerForFinalQuiz() {
   // 먼저 정답 처리
   completedQuizzes.push(currentQuiz);
   localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
   
   markQuizCompleted(currentQuiz);
   updateUI();
   
   // 모달을 부드럽게 닫기
   const modal = document.getElementById('quizModal');
   modal.style.transition = 'all 0.5s ease-out';
   modal.style.opacity = '0';
   modal.style.transform = 'scale(0.9)';
   
   setTimeout(() => {
       closeModal();
       modal.style.transition = '';
       modal.style.opacity = '';
       modal.style.transform = '';
       
       // 바로 엔딩 시퀀스 시작
       setTimeout(() => {
           startEndingSequence();
       }, 300);
   }, 500);
}

// 엔딩 시퀀스 시작 (최종 메시지 제거 + 배경음악 추가)
function startEndingSequence() {
   stopRoomTimer(); // 타이머 중지
   
   // 1. 화면 어두워지기
   const fadeOverlay = document.createElement('div');
   fadeOverlay.id = 'fadeOverlay';
   fadeOverlay.style.cssText = `
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background: black;
       z-index: 8000;
       opacity: 0;
       transition: opacity 2s ease-in-out;
   `;
   document.body.appendChild(fadeOverlay);
   
   // 페이드 인 시작
   setTimeout(() => {
       fadeOverlay.style.opacity = '1';
   }, 100);
   
   // 2. 어두워진 후 엔딩 화면 준비
   setTimeout(() => {
       // 게임 화면 숨기기
       document.getElementById('gameScreen').style.display = 'none';
       
       // 엔딩 화면 준비 (줌인 상태로 시작)
       const endingScreen = document.getElementById('endingScreen');
       endingScreen.style.display = 'flex';
       endingScreen.style.opacity = '1';
       endingScreen.style.transform = 'scale(1.5)'; // 줌인 상태
       endingScreen.classList.add('active');

       // 배경음악 시작
       playBackgroundMusic();
       
       // 3. 페이드 아웃하면서 엔딩 이미지 보이기
       setTimeout(() => {
           fadeOverlay.style.opacity = '0';
           
           // 4. 동시에 줌아웃 효과
           endingScreen.style.transition = 'transform 3s ease-out';
           endingScreen.style.transform = 'scale(1)'; // 줌아웃
           
           // 5. 페이드 오버레이 제거 및 배경음악 시작
           setTimeout(() => {
               if (fadeOverlay.parentNode) {
                   fadeOverlay.parentNode.removeChild(fadeOverlay);
               }
               
               // 축하 효과만 추가 (메시지 없이)
               createCelebrationEffect();
               
               localStorage.setItem('gameCompleted', 'true');
           }, 2000);
       }, 500);
   }, 2000);
}

// 답안 정규화
function normalizeAnswer(answer) {
   return answer.toLowerCase()
               .replace(/\s+/g, '')
               .replace(/[이가을를의에서]/g, '');
}

// 정답 처리
function correctAnswer() {
   if (!completedQuizzes.includes(currentQuiz)) {
        completedQuizzes.push(currentQuiz);
   }
   localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
   
   markQuizCompleted(currentQuiz);
   closeModal();
   updateUI();
   updateClickableStates(); // ✨ 정답 후 오브젝트 상태 업데이트
   
   playCompletionEffect();
   checkRoomCompletion();
}

// 오답 처리
function wrongAnswer() {
   showMessage("다시 입력해 주세요");
   
   const quiz = quizzes[currentQuiz];
   if (quiz.type === 'matching') {
       // 매칭 게임은 자동으로 피드백이 제공됨
       return;
   } else if (quiz.type === 'four') {
       for (let i = 1; i <= 4; i++) {
           document.getElementById(`answer${i}`).value = '';
       }
       document.getElementById('answer1').focus();
   } else {
       document.getElementById('quizAnswer').value = '';
       document.getElementById('quizAnswer').focus();
   }
}

// 퀴즈 완료 표시
function markQuizCompleted(quizId) {
    const targetElement = document.querySelector(`.clickable[data-quiz-id='${quizId}']`);
    if (targetElement) {
        targetElement.classList.add('completed');
    }
}


// 완료 효과
function playCompletionEffect() {
   const elements = document.querySelectorAll('.clickable.completed');
   const lastElement = elements[elements.length - 1];
   if (lastElement) {
       lastElement.style.animation = 'none';
       setTimeout(() => {
           lastElement.style.animation = 'glow 1s ease-in-out';
       }, 10);
   }
}

// 방 완료 확인
function checkRoomCompletion() {
   const roomQuizzes = getRoomQuizzes(currentRoom);
   const completed = roomQuizzes.every(id => completedQuizzes.includes(id));
   
   if (completed) {
       if (currentRoom < 3) {
           document.getElementById('nextRoomBtn').style.display = 'block';
       }
       // 방3 완료는 마지막 퀴즈(12번)에서 직접 처리
   } else {
       document.getElementById('nextRoomBtn').style.display = 'none';
   }
}

// 방별 퀴즈 ID 반환
function getRoomQuizzes(roomNum) {
   switch(roomNum) {
       case 1: return [1, 2, 3, 4];
       case 2: return [5, 6, 7, 8];
       case 3: return [9, 10, 11, 12];
       default: return [];
   }
}

// 승리 메시지 표시 (콜백 추가)
function showVictoryMessage(callback) {
   // 기존 메시지 제거
   const existingMessages = document.querySelectorAll('.victory-message');
   existingMessages.forEach(msg => msg.remove());
   
   const message = document.createElement('div');
   message.className = 'victory-message';
   message.innerHTML = `
       <div class="victory-content">
           <h3>🎉 축하합니다! 🎉</h3>
           <p>마지막 시험을 통과하셨습니다!</p>
       </div>
   `;
   
   // 스타일 적용
   message.style.cssText = `
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background: rgba(0,0,0,0.9);
       z-index: 3000;
       display: flex;
       justify-content: center;
       align-items: center;
       animation: victoryFadeIn 0.5s ease-out;
   `;
   
   const victoryContent = message.querySelector('.victory-content');
   victoryContent.style.cssText = `
       background: linear-gradient(135deg, #4caf50, #2e7d32);
       padding: 40px;
       border-radius: 20px;
       text-align: center;
       color: white;
       box-shadow: 0 0 50px rgba(76,175,80,0.8);
       animation: victoryPulse 1s ease-in-out infinite alternate;
   `;
   
   const h3 = victoryContent.querySelector('h3');
   h3.style.cssText = `
       font-size: 2.5rem;
       margin-bottom: 20px;
       text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
   `;
   
   const paragraphs = victoryContent.querySelectorAll('p');
   paragraphs.forEach(p => {
       p.style.cssText = `
           font-size: 1.3rem;
           margin-bottom: 15px;
           line-height: 1.4;
       `;
   });
   
   document.body.appendChild(message);
   
   // 애니메이션 키프레임 추가
   if (!document.querySelector('#victoryAnimations')) {
       const style = document.createElement('style');
       style.id = 'victoryAnimations';
       style.textContent = `
           @keyframes victoryFadeIn {
               from { opacity: 0; transform: scale(0.8); }
               to { opacity: 1; transform: scale(1); }
           }
           @keyframes victoryPulse {
               from { transform: scale(1); box-shadow: 0 0 50px rgba(76,175,80,0.8); }
               to { transform: scale(1.02); box-shadow: 0 0 70px rgba(76,175,80,1); }
           }
       `;
       document.head.appendChild(style);
   }
   
   // 2.5초 후 메시지 제거 및 콜백 실행
   setTimeout(() => {
       message.style.animation = 'victoryFadeOut 0.5s ease-out forwards';
       setTimeout(() => {
           if (message.parentNode) {
               message.parentNode.removeChild(message);
           }
           if (callback) callback();
       }, 500);
   }, 2500);
   
   // fadeOut 애니메이션 추가
   const existingStyle = document.querySelector('#victoryAnimations');
   if (existingStyle) {
       existingStyle.textContent += `
           @keyframes victoryFadeOut {
               from { opacity: 1; transform: scale(1); }
               to { opacity: 0; transform: scale(0.8); }
           }
       `;
   }
}

// 축하 효과 생성
function createCelebrationEffect() {
   // 색종이 효과 생성
   for (let i = 0; i < 50; i++) {
       createConfetti();
   }
   
   // 계속 지속적으로 색종이 생성
   confettiInterval = setInterval(() => {
       for (let i = 0; i < 10; i++) {
           createConfetti();
       }
   }, 200);
}

// 색종이 개별 생성
function createConfetti() {
   const confetti = document.createElement('div');
   const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
   const randomColor = colors[Math.floor(Math.random() * colors.length)];
   
   confetti.style.cssText = `
       position: fixed;
       width: 10px;
       height: 10px;
       background: ${randomColor};
       top: -10px;
       left: ${Math.random() * 100}vw;
       z-index: 9999;
       border-radius: 2px;
       pointer-events: none;
       animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
   `;
   
   document.body.appendChild(confetti);
   
   // 색종이 애니메이션 추가
   if (!document.querySelector('#confettiAnimation')) {
       const style = document.createElement('style');
       style.id = 'confettiAnimation';
       style.textContent = `
           @keyframes confettiFall {
               to {
                   transform: translateY(100vh) rotate(360deg);
                   opacity: 0;
               }
           }
       `;
       document.head.appendChild(style);
   }
   
   // 애니메이션 완료 후 요소 제거
   setTimeout(() => {
       if (confetti.parentNode) {
           confetti.parentNode.removeChild(confetti);
       }
   }, 5000);
}

// 다음 방으로 이동 (스토리 모달 호출로 수정)
function nextRoom() {
   const nextRoomNum = currentRoom + 1;
   
   // 타이머 중지
   stopRoomTimer();
   
   const videoKey = `room${currentRoom}`;
   showTransitionWithVideo(videoKey, () => {
       document.getElementById(`room${currentRoom}`).classList.add('exit-left');
       
       setTimeout(() => {
           currentRoom = nextRoomNum;
           localStorage.setItem('currentRoom', currentRoom);
           showRoom(currentRoom);
           document.getElementById('nextRoomBtn').style.display = 'none';
           updateUI();
           // 다음 방의 스토리를 보여줌
           showStoryModal(currentRoom);
       }, 400);
   });
}


// 방 표시
function showRoom(roomNum) {
   for (let i = 1; i <= 3; i++) {
       const room = document.getElementById(`room${i}`);
       room.style.display = 'none';
       room.classList.remove('active', 'exit-left');
   }
   
   const currentRoomElement = document.getElementById(`room${roomNum}`);
   currentRoomElement.style.display = 'block';
   
   setTimeout(() => {
       currentRoomElement.classList.add('active');
   }, 100);
}

// UI 업데이트
function updateUI() {
   const totalCompleted = completedQuizzes.length;
   const roomNames = {
       1: "ROOM 1",
       2: "ROOM 2", 
       3: "ROOM 3"
   };
   
   document.getElementById('progress').textContent = `${totalCompleted}/12 완료`;
   document.getElementById('roomInfo').textContent = roomNames[currentRoom] || `방 ${currentRoom}`;
}

// 모달 닫기 (퀴즈 모달만)
function closeModal() {
   document.getElementById('quizModal').style.display = 'none';
   currentQuiz = null;
}

// 메시지 표시
function showMessage(text) {
   // 기존 메시지가 있다면 제거
   const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
   const message = document.createElement('div');
   message.className = 'message';
   message.textContent = text;
   // 스타일 추가
    message.style.cssText = `
        position: fixed;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 30px;
        font-size: 1.2rem;
        font-weight: bold;
        z-index: 10001;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        animation: messageFade 1.5s ease-out forwards;
    `;

    // 애니메이션 키프레임 추가
    if (!document.querySelector('#messageAnimation')) {
        const style = document.createElement('style');
        style.id = 'messageAnimation';
        style.textContent = `
            @keyframes messageFade {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                20% { opacity: 1; transform: translate(-50%, 0); }
                80% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);
    }
   document.body.appendChild(message);
   
   setTimeout(() => {
       if (message.parentNode) {
           message.parentNode.removeChild(message);
       }
   }, 1500);
}

// 게임 재시작 - 부드러운 전환 추가 (스토리 기록 삭제 추가)
function restartGame() {
   stopRoomTimer(); // 타이머 중지
   stopBackgroundMusic(); // 배경음악 중지
   
   // 색종이 인터벌 정지 추가
   if (confettiInterval) {
       clearInterval(confettiInterval);
       confettiInterval = null;
   }
   
   // 색종이 효과 정리
   const confettis = document.querySelectorAll('div[style*="confettiFall"]');
   confettis.forEach(confetti => {
       if (confetti.parentNode) {
           confetti.parentNode.removeChild(confetti);
       }
   });
   
   // 상태 초기화
   currentRoom = 1;
   completedQuizzes = [];
   currentQuiz = null;
   timeLeft = 600;
   isTimerActive = false;
   shownStories = []; // 스토리 기록 초기화
   
   localStorage.removeItem('completedQuizzes');
   localStorage.removeItem('currentRoom');
   localStorage.removeItem('gameCompleted');
   localStorage.removeItem('shownStories'); // 로컬 스토리지에서도 삭제
   
   document.querySelectorAll('.clickable').forEach(element => {
       element.classList.remove('completed');
       element.style.animation = '';
   });
   
   // 모든 화면 리셋
   document.getElementById('endingScreen').classList.remove('active');
   document.getElementById('gameScreen').classList.remove('active');
   document.getElementById('gameOverScreen').classList.remove('active');
   document.getElementById('gameOverScreen').style.display = 'none';
   
   // 부드럽게 시작 화면으로 전환
   document.getElementById('endingScreen').style.transition = 'opacity 1s ease-out';
   document.getElementById('endingScreen').style.opacity = '0';
   
   setTimeout(() => {
       document.getElementById('endingScreen').style.display = 'none';
       document.getElementById('endingScreen').style.transition = '';
       document.getElementById('endingScreen').style.opacity = '';
       document.getElementById('endingScreen').style.transform = '';
       
       document.getElementById('startScreen').style.display = 'flex';
       document.getElementById('startScreen').classList.remove('fade-out');
       document.getElementById('nextRoomBtn').style.display = 'none';
       
       hideTimerWarning();
       showRoom(1);
       updateUI();
       updateClickableStates(); // ✨ 재시작 시 오브젝트 상태 초기화
   }, 1000);
}

// 비디오 포함 전환 효과 - 텍스트 제거
function showTransitionWithVideo(videoKey, callback) {
   const transition = document.getElementById('screenTransition');
   const video = document.getElementById('transitionVideo');
   video.muted = false;
   // 전환 효과 시작
   transition.classList.add('active');
   
   // 비디오 설정
   const videoSrc = transitionVideos[videoKey];
   let videoLoaded = false;
   let callbackExecuted = false;
   
   if (videoSrc) {
       // 기존 이벤트 리스너 제거
       video.removeEventListener('loadeddata', handleVideoLoad);
       video.removeEventListener('ended', handleVideoEnd);
       video.removeEventListener('error', handleVideoError);
       
       video.src = videoSrc;
       
       // 비디오 로드 처리
       function handleVideoLoad() {
           videoLoaded = true;
           video.play().catch(e => {
               console.log('비디오 자동재생 실패, 기본 전환으로 진행:', e);
               executeCallback();
           });
       }
       
       // 비디오 종료 처리
       function handleVideoEnd() {
           executeCallback();
       }
       
       // 비디오 에러 처리
       function handleVideoError() {
           console.log('비디오 로드 실패, 기본 전환으로 진행');
           executeCallback();
       }
       
       // 콜백 실행 함수
       function executeCallback() {
           if (callbackExecuted) return;
           callbackExecuted = true;
           
           if (callback) callback();
           
           setTimeout(() => {
               transition.classList.remove('active');
               video.src = '';
               video.removeEventListener('loadeddata', handleVideoLoad);
               video.removeEventListener('ended', handleVideoEnd);
               video.removeEventListener('error', handleVideoError);
           }, 300);
       }
       
       // 이벤트 리스너 등록
       video.addEventListener('loadeddata', handleVideoLoad, { once: true });
       video.addEventListener('ended', handleVideoEnd, { once: true });
       video.addEventListener('error', handleVideoError, { once: true });
       
       // 비디오 로드 시작
       video.load();
       
       // 비디오 로드 타임아웃 (3초)
       setTimeout(() => {
           if (!videoLoaded && !callbackExecuted) {
               console.log('비디오 로드 시간 초과, 기본 전환으로 진행');
               executeCallback();
           }
       }, 3000);
       
   } else {
       // 비디오가 없는 경우 기본 전환 효과
       console.log('비디오 파일 없음, 기본 전환 효과 사용');
       setTimeout(() => {
           if (callback) callback();
           setTimeout(() => {
               transition.classList.remove('active');
           }, 500);
       }, 1500);
   }
   
   // 최대 대기 시간 (5초) 후 강제 진행
   setTimeout(() => {
       if (!callbackExecuted) {
           console.log('최대 대기 시간 초과, 강제 진행');
           if (callback) callback();
           setTimeout(() => {
               transition.classList.remove('active');
               video.src = '';
           }, 500);
       }
   }, 7000);
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
   if (e.key === 'Escape') {
       closeModal();
   }
});

// 모달 외부 클릭 시 닫기
document.getElementById('quizModal').addEventListener('click', function(e) {
   if (e.target === this) {
       closeModal();
   }
});

// 페이지 로드 시 초기화 (사운드 초기화 추가 및 전체 화면 요청)
window.addEventListener('load', function() {
    // ✨ 클릭 이벤트 리스너들 초기 설정
    initializeClickables();
    
    // 사운드 초기화
    initializeSounds();
 
    const gameCompleted = localStorage.getItem('gameCompleted');
    if (gameCompleted) {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('endingScreen').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('endingScreen').classList.add('active');
            playBackgroundMusic();
        }, 100);
    } else {
        const savedRoom = localStorage.getItem('currentRoom');
        const savedQuizzes = localStorage.getItem('completedQuizzes');
        
        if (savedRoom && savedQuizzes) {
            // ✨ 저장된 게임이 있으면 '이어서 하기' 화면 표시
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('resumeScreen').style.display = 'flex';
        } else {
            // 저장된 게임이 없으면 시작 화면 표시 (기존 로직)
            document.getElementById('startScreen').style.display = 'flex';
            updateClickableStates(); // ✨ 새 게임 시작 시 오브젝트 상태 초기화
        }
    }
 });

