// 게임 상태
let currentRoom = 1;
let completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes')) || [];
let currentQuiz = null;

// ✨ 오브젝트 순서 관리 추가
let currentObjectIndex = JSON.parse(localStorage.getItem('currentObjectIndex')) || { 1: 0, 2: 0, 3: 0 };

// 각 방의 오브젝트 순서 정의 (퀴즈 ID)
const roomObjectOrder = {
    1: [1, 2, 3, 4],  // 나무 → 항아리 → 촛불 → 문
    2: [5, 7, 6, 8],  // 모래시계 → 가면 → 상자 → 문
    3: [9, 10, 11, 12] // 성경 → 방패 → 십자가 → 문
};

// ✨ 퀴즈 ID와 오브젝트 클래스 매핑
const objectClasses = {
    1: 'tree', 2: 'jar', 3: 'candle', 4: 'door1',
    5: 'hourglass', 6: 'box', 7: 'mask', 8: 'door2',
    9: 'bible', 10: 'shield', 11: 'cross', 12: 'door3'
};

// 오브젝트별 힌트 메시지
const hintMessages = {
    1: "언어의 뿌리가 빛을 발한다...",
    2: "오래된 지식이 깨어난다...",
    3: "지혜의 불꽃이 타오른다...",
    4: "첫 번째 시험의 문이 열린다!",
    5: "시간 속에 담긴 비밀이 드러난다...",
    7: "숨겨진 진실이 나타난다...",
    6: "봉인된 지혜가 풀린다...",
    8: "두 번째 시험의 문이 열린다!",
    9: "신성한 지식이 빛난다...",
    10: "수호자의 시험이 시작된다...",
    11: "마지막 관문이 열린다...",
    12: "언어 마법사에게 가는 문이 열린다!"
};

// 미션 모달 내용
const missionTexts = {
    1: {
        title: "🔮 첫 번째 시험 🔮",
        text: "언어 마법사의 첫 번째 시험에 오신 것을 환영합니다.\n\n흩어진 말들을 올바르게 분류하면,\n다음 시험으로 가는 문이 열릴 것입니다.\n\n빛나는 곳에서 시험이 시작됩니다..."
    },
    2: {
        title: "🔮 두 번째 시험 🔮",
        text: "두 번째 시험의 방입니다.\n\n말들의 움직임과 역할을 이해하는 자만이\n통과할 수 있습니다.\n\n빛을 따라 시험을 이어가세요..."
    },
    3: {
        title: "🔮 마지막 시험 🔮",
        text: "마지막 시험의 방입니다.\n\n언어의 관계를 깨달은 자만이\n마법사를 만날 수 있습니다.\n\n모든 지혜를 모아 시험을 완수하세요..."
    }
};

// 타이머 관련 변수
let roomTimer = null;
let timeLeft = 600;
let tickSound = null;
let isTimerActive = false;

// 사운드 관련 변수
let backgroundMusic = null;
let clickSound = null;
let soundsLoaded = false;
let confettiInterval = null;

// 전환 비디오 설정
const transitionVideos = {
    start: 'videos/start_to_room1.mp4',
    room1: 'videos/room1_to_room2.mp4',
    room2: 'videos/room2_to_room3.mp4'
};

// 퀴즈 데이터
const quizzes = {
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
    5: {
        title: "체언의 종류",
        question: "다음 빈칸에 들어갈 알맞은 단어를 순서대로 채우세요.\n\n1. 사람이나 사물의 이름을 나타내는 품사는? (예: 하늘, 사랑)\n2. 이름을 대신하여 가리키는 품사는? (예: 나, 우리, 여기)\n3. 수량이나 순서를 나타내는 품사는? (예: 하나, 첫째)\n4. 위 세 품사를 묶어 OOO이라고 합니다.",
        answers: ["명사", "대명사", "수사", "체언"],
        type: "four"
    },
    6: {
        title: "품사 배열하기",
        question: "예시 문장: '나는 새 신발을 샀다.'\n\n아래 품사들을 위 문장의 순서에 맞게 올바르게 배열하세요.",
        shuffledWords: ["대명사", "조사", "관형사", "명사", "조사", "동사"].sort(() => Math.random() - 0.5),
        correctOrder: ["대명사", "조사", "관형사", "명사", "조사", "동사"],
        type: "word_sort"
    },
    7: {
        title: "용언의 종류 (1)",
        question: "사람이나 사물의 움직임을 나타내는 품사는 무엇일까요? (예: 먹다, 달리다)",
        answers: ["동사"],
        type: "single"
    },
    8: {
        title: "두 번째 방 탈출",
        question: "두 번째 방을 탈출하기 위한 <span class='highlight-red'>비밀번호</span>. (힌트: 동사와 형용사를 묶어 이르는 말)",
        answers: ["용언"],
        type: "password"
    },
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

// 전체 화면 실행
function requestFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(console.error);
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

// 사운드 초기화 및 로드
function initializeSounds() {
    try {
        backgroundMusic = new Audio('sounds/ending_music.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.6;
        
        clickSound = new Audio('sounds/click_sound.mp3');
        clickSound.volume = 0.8;
        
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
            clickSound.currentTime = 0;
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

// 게임 시작
function startGame() {
    requestFullScreen();
    console.log('게임 시작 버튼 클릭됨');
    
    showTransitionWithVideo('start', () => {
        document.getElementById('startScreen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'block';
            setTimeout(() => {
                document.getElementById('gameScreen').classList.add('active');
                showRoom(1);
                
                // ✨ 미션 모달 표시
                showMissionModal(1, () => {
                    activateCurrentObject();
                    startRoomTimer();
                });
            }, 50);
            loadGameState();
            updateUI();
        }, 800);
    });
}

// 게임 이어하기
function requestFullScreenAndResume() {
    requestFullScreen();
    
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
            activateCurrentObject();
            startRoomTimer();
        }, 50);
    }, 500);
}

// ✨ 미션 모달 표시
function showMissionModal(roomNum, callback) {
    const modal = document.getElementById('missionModal');
    const mission = missionTexts[roomNum];
    
    document.getElementById('missionTitle').textContent = mission.title;
    document.getElementById('missionText').textContent = mission.text;
    
    modal.classList.add('active');
    
    window.missionCallback = callback;
}

// ✨ 미션 모달 닫기
function closeMissionModal() {
    const modal = document.getElementById('missionModal');
    modal.style.animation = 'fadeOut 0.5s ease-out forwards';
    
    setTimeout(() => {
        modal.classList.remove('active');
        modal.style.animation = '';
        
        if (window.missionCallback) {
            window.missionCallback();
            window.missionCallback = null;
        }
    }, 500);
    
    if (!document.querySelector('#missionFadeOut')) {
        const style = document.createElement('style');
        style.id = 'missionFadeOut';
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ✨ 힌트 메시지 표시
function showHintMessage(quizId) {
    const hintElement = document.getElementById('hintMessage');
    const message = hintMessages[quizId];
    
    hintElement.textContent = message;
    hintElement.classList.add('active');
    
    setTimeout(() => {
        hintElement.style.animation = 'hintDisappear 0.5s ease-out forwards';
        setTimeout(() => {
            hintElement.classList.remove('active');
            hintElement.style.animation = '';
        }, 500);
    }, 5000);
    
    if (!document.querySelector('#hintDisappearAnim')) {
        const style = document.createElement('style');
        style.id = 'hintDisappearAnim';
        style.textContent = `
            @keyframes hintDisappear {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ✨ 현재 활성화되어야 할 오브젝트 활성화
function activateCurrentObject() {
    const roomOrder = roomObjectOrder[currentRoom];
    const currentIndex = currentObjectIndex[currentRoom];
    
    if (currentIndex < roomOrder.length) {
        const quizId = roomOrder[currentIndex];
        
        if (!completedQuizzes.includes(quizId)) {
            activateObject(quizId);
            showHintMessage(quizId);
        }
    }
}

// ✨ 특정 오브젝트 활성화
function activateObject(quizId) {
    document.querySelectorAll('.clickable').forEach(el => {
        el.classList.remove('active');
    });
    
    const className = objectClasses[quizId];
    const targetElement = document.querySelector(`.${className}`);
    
    if (targetElement && !targetElement.classList.contains('completed')) {
        targetElement.classList.add('active');
    }
}

// 타이머 초기화
function initTimer() {
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
    
    timeLeft = 420;
    isTimerActive = true;
    updateTimerDisplay();
    initTimer();
    
    roomTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 120 && tickSound) {
            try {
                tickSound();
            } catch (error) {
                console.log('똑딱 소리 재생 실패:', error);
            }
        }
        
        if (timeLeft === 120) {
            showTimerWarning();
        }
        
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
    
    timerElement.classList.remove('warning', 'danger');
    
    if (timeLeft <= 60) {
        timerElement.classList.add('danger');
    } else if (timeLeft <= 120) {
        timerElement.classList.add('warning');
    }
}

// 타이머 경고 표시
function showTimerWarning() {
    const warningElement = document.getElementById('timerWarning');
    warningElement.style.display = 'block';
    
    setTimeout(() => {
        hideTimerWarning();
    }, 5000);
}

// 타이머 경고 숨김
function hideTimerWarning() {
    const warningElement = document.getElementById('timerWarning');
    warningElement.style.display = 'none';
}

// 게임오버
function gameOver() {
    stopRoomTimer();
    stopBackgroundMusic();
    
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('endingScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
    
    document.getElementById('gameOverScreen').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('gameOverScreen').classList.add('active');
    }, 100);
    
    closeModal();
}

// 게임 상태 로드
function loadGameState() {
    const savedRoom = localStorage.getItem('currentRoom');
    if (savedRoom) {
        currentRoom = parseInt(savedRoom);
        showRoom(currentRoom);
    }
    
    const savedIndex = localStorage.getItem('currentObjectIndex');
    if (savedIndex) {
        currentObjectIndex = JSON.parse(savedIndex);
    }
    
    completedQuizzes.forEach(quizId => {
        markQuizCompleted(quizId);
    });
    
    checkRoomCompletion();
}

// 퀴즈 열기
function openQuiz(quizId) {
    // ✨ 활성화되지 않은 오브젝트는 클릭 불가
    const roomOrder = roomObjectOrder[currentRoom];
    const currentIndex = currentObjectIndex[currentRoom];
    const expectedQuizId = roomOrder[currentIndex];
    
    const isCompleted = completedQuizzes.includes(quizId);
    
    if (!isCompleted && quizId !== expectedQuizId) {
        showMessage("빛나는 곳부터 차례대로 시험을 치러야 합니다!");
        return;
    }
    
    playClickSound();
    
    currentQuiz = quizId;
    const quiz = quizzes[quizId];
    
    const modalContent = document.querySelector('.modal-content');
    
    if (quiz.type === 'matching' || quiz.type === 'word_sort' || quiz.type === 'word_classification') {
        modalContent.style.maxWidth = '1300px';
        modalContent.style.width = '95%';
    } else if (quiz.type === 'four') {
        modalContent.style.maxWidth = '1000px';
        modalContent.style.width = '95%';
    } else if (quiz.type === 'single' || quiz.type === 'password') {
        modalContent.style.maxWidth = '1000px';
        modalContent.style.width = '95%';
    } else {
        modalContent.style.maxWidth = '1000px';
        modalContent.style.width = '95%';
    }
    
    document.getElementById('quizTitle').style.display = 'none';
    document.getElementById('quizTitle').textContent = quiz.title;
    document.getElementById('quizQuestion').innerHTML = quiz.question;
    
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
    
    const answerContainer = document.createElement('div');
    answerContainer.className = 'completed-quiz-display';
    
    const answerTitle = document.createElement('h4');
    answerTitle.textContent = '✅ 정답:';
    answerTitle.style.color = '#00ff00';
    answerTitle.style.marginBottom = '15px';
    answerTitle.style.fontSize = '1.5rem';
    answerContainer.appendChild(answerTitle);
    
    if (quiz.type === 'matching') {
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
    
    const completedMessage = document.createElement('p');
    completedMessage.textContent = '이미 완료된 퀴즈입니다. 참고용으로 정답을 확인할 수 있습니다.';
    completedMessage.style.color = '#ffd700';
    completedMessage.style.textAlign = 'center';
    completedMessage.style.fontStyle = 'italic';
    completedMessage.style.marginTop = '15px';
    completedMessage.style.fontSize = '1.1rem';
    answerContainer.appendChild(completedMessage);
    
    inputContainer.appendChild(answerContainer);
    
    const submitBtn = document.querySelector('.submit-btn');
    const closeBtn = document.querySelector('.close-btn');
    
    if (submitBtn) {
        submitBtn.style.display = 'none';
    }
    
    if (closeBtn) {
        closeBtn.textContent = '확인';
        closeBtn.style.background = 'linear-gradient(45deg, #4caf50, #2e7d32)';
    }
}

// 단어 분류 게임 생성
function createWordClassificationGame() {
    const inputContainer = document.getElementById('quizInput');
    inputContainer.innerHTML = '';

    const quiz = quizzes[currentQuiz];

    const gameContainer = document.createElement('div');
    gameContainer.className = 'word-classification-container';

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

    const shuffledWords = [...quiz.words].sort(() => Math.random() - 0.5);
    shuffledWords.forEach((word, index) => {
        const wordElement = createWordElement(word, index);
        unclassifiedContainer.appendChild(wordElement);
    });

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

    gameContainer.appendChild(unclassifiedContainer);
    gameContainer.appendChild(dropZonesContainer);
    inputContainer.appendChild(gameContainer);

    setupDropZones(unclassifiedContainer, ...dropZonesContainer.querySelectorAll('.category-drop-zone'));
}

// 단어 분류 완료 확인
function checkWordClassificationCompletion() {
    const quiz = quizzes[currentQuiz];
    const unclassifiedContainer = document.querySelector('.unclassified-words-container');

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

    if (allCorrect) {
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
        
        setTimeout(() => {
            correctAnswer();
        }, wordElements.length * 100 + 500);
    }
}

// 매칭 게임 생성
function createMatchingGame() {
    const inputContainer = document.getElementById('quizInput');
    inputContainer.innerHTML = '';
    
    const quiz = quizzes[currentQuiz];
    
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
    
    const periodsContainer = document.createElement('div');
    periodsContainer.className = 'periods-container';
    periodsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    
    const arrowContainer = document.createElement('div');
    arrowContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding-top: 20px;
    `;
    
    const lawsContainer = document.createElement('div');
    lawsContainer.className = 'laws-container';
    lawsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    
    const shuffledLaws = [...quiz.laws].sort(() => Math.random() - 0.5);
    
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
    
    gameContainer.appendChild(periodsContainer);
    gameContainer.appendChild(arrowContainer);
    gameContainer.appendChild(lawsContainer);
    
    inputContainer.appendChild(gameContainer);
    
    window.selectedPeriod = null;
    window.currentMatches = {};
    window.correctMatches = quiz.correctMatches;
}

// 단어 정렬 게임 생성
function createWordSortGame() {
    const inputContainer = document.getElementById('quizInput');
    inputContainer.innerHTML = '';
    
    const quiz = quizzes[currentQuiz];
    
    const gameContainer = document.createElement('div');
    gameContainer.className = 'word-sort-game-container';
    gameContainer.style.cssText = `
        max-width: 900px;
        margin: 0 auto;
    `;
    
    const instructionText = document.createElement('p');
    instructionText.textContent = '단어를 드래그하여 올바른 순서로 배열하세요.';
    instructionText.style.cssText = `
        text-align: center;
        color: #ffd700;
        font-size: 1.2rem;
        margin-bottom: 30px;
        font-style: italic;
    `;
    
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
   
   const shuffledWords = [...quiz.shuffledWords].sort(() => Math.random() - 0.5);
   
   shuffledWords.forEach((word, index) => {
       const wordElement = createWordElement(word, index);
       shuffledContainer.appendChild(wordElement);
   });
   
   gameContainer.appendChild(instructionText);
   gameContainer.appendChild(shuffledContainer);
   gameContainer.appendChild(answerContainer);
   
   inputContainer.appendChild(gameContainer);
   
   setupDropZones(shuffledContainer, answerContainer);
   
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
   
   wordElement.addEventListener('dragstart', handleDragStart);
   wordElement.addEventListener('dragend', handleDragEnd);
   
   wordElement.addEventListener('touchstart', handleTouchStart, { passive: false });
   wordElement.addEventListener('touchmove', handleTouchMove, { passive: false });
   wordElement.addEventListener('touchend', handleTouchEnd, { passive: false });
   
   return wordElement;
}

// 드롭 영역 설정
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
   e.dataTransfer.setData('text/plain', e.target.dataset.index);
   e.target.classList.add('dragging');
}

// 드래그 종료
function handleDragEnd(e) {
   e.target.classList.remove('dragging');
}

// 드래그 오버
function handleDragOver(e) {
   e.preventDefault();
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
        if (draggedElement.tagName.toLowerCase() !== 'p') {
            e.currentTarget.appendChild(draggedElement);
        }
        
        const quizType = quizzes[currentQuiz].type;
        if (quizType === 'word_sort') {
            checkWordSortCompletion();
        } else if (quizType === 'word_classification') {
            checkWordClassificationCompletion();
        }
    }
    
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

// 터치 이벤트 핸들러
let draggedTouchElement = null;
let touchOffsetX = 0;
let touchOffsetY = 0;

function handleTouchStart(e) {
    e.preventDefault();
    draggedTouchElement = e.target;
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();

    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;

    draggedTouchElement.classList.add('touch-dragging');
    draggedTouchElement.style.left = `${rect.left}px`;
    draggedTouchElement.style.top = `${rect.top}px`;

    document.body.style.overflow = 'hidden';
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!draggedTouchElement) return;
    
    const touch = e.touches[0];
    const x = touch.clientX - touchOffsetX;
    const y = touch.clientY - touchOffsetY;
    draggedTouchElement.style.left = `${x}px`;
    draggedTouchElement.style.top = `${y}px`;
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!draggedTouchElement) return;

    const touch = e.changedTouches[0];

    draggedTouchElement.style.display = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    draggedTouchElement.style.display = '';

    const dropContainer = elementBelow?.closest('.shuffled-words-container, .answer-words-container, .category-drop-zone, .unclassified-words-container');

    draggedTouchElement.classList.remove('touch-dragging');
    draggedTouchElement.style.left = '';
    draggedTouchElement.style.top = '';
    document.body.style.overflow = '';

    if (dropContainer && dropContainer !== draggedTouchElement.parentNode) {
        if (draggedTouchElement.tagName.toLowerCase() !== 'p') {
            dropContainer.appendChild(draggedTouchElement);
        }
        
        const quizType = quizzes[currentQuiz].type;
        if (quizType === 'word_sort') {
            checkWordSortCompletion();
        } else if (quizType === 'word_classification') {
            checkWordClassificationCompletion();
        }
    }

    draggedTouchElement = null;
}

// 단어 정렬 완료 확인
function checkWordSortCompletion() {
   const answerContainer = document.querySelector('.answer-words-container');
   const wordsInAnswer = Array.from(answerContainer.querySelectorAll('.word-element'))
       .map(el => el.dataset.word);
   
   if (wordsInAnswer.length === window.correctWordOrder.length) {
       const isCorrectOrder = wordsInAnswer.every((word, index) => 
           word === window.correctWordOrder[index]
       );
       
       if (isCorrectOrder) {
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
   document.querySelectorAll('.period-item').forEach(item => {
       item.style.borderColor = 'transparent';
       item.style.boxShadow = 'none';
   });
   
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
   
   window.currentMatches[window.selectedPeriod] = selectedLaw;
   
   const isCorrect = window.correctMatches[window.selectedPeriod] === selectedLaw;
   
   if (isCorrect) {
       lawElement.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
       lawElement.style.borderColor = '#00ff00';
       lawElement.style.pointerEvents = 'none';
       
       const periodElement = document.querySelector(`[data-period="${window.selectedPeriod}"]`);
       periodElement.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
       periodElement.style.borderColor = '#00ff00';
       periodElement.style.pointerEvents = 'none';
       
       createConnectionLine(periodElement, lawElement);
   } else {
       lawElement.style.background = 'linear-gradient(135deg, #f44336, #c62828)';
       setTimeout(() => {
           lawElement.style.background = 'linear-gradient(135deg, #4a90e2, #357abd)';
       }, 1000);
       
       delete window.currentMatches[window.selectedPeriod];
   }
   
   document.querySelectorAll('.period-item').forEach(item => {
       if (!item.style.pointerEvents || item.style.pointerEvents === 'auto') {
            item.style.borderColor = 'transparent';
            item.style.boxShadow = 'none';
       }
   });
   window.selectedPeriod = null;
   
   if (Object.keys(window.currentMatches).length === 5) {
       setTimeout(() => {
           checkMatchingComplete();
       }, 500);
   }
}

// 연결선 생성
function createConnectionLine(periodElement, lawElement) {
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
   } else if (type === 'word_classification') {
       createWordClassificationGame();
   }
   
   const submitBtn = document.querySelector('.submit-btn');
   const closeBtn = document.querySelector('.close-btn');
   
   if (submitBtn) {
       submitBtn.style.display = 'inline-block';
   }
   
   if (closeBtn) {
       closeBtn.textContent = '닫기';
       closeBtn.style.background = 'linear-gradient(45deg, #f44336, #c62828)';
   }
}

// 정답 확인
function checkAnswer() {
   const quiz = quizzes[currentQuiz];
   let userAnswer = '';
   
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
       if (currentQuiz === 12) {
           correctAnswerForFinalQuiz();
       } else {
           correctAnswer();
       }
   } else {
       wrongAnswer();
   }
}

// 마지막 퀴즈 정답 처리
function correctAnswerForFinalQuiz() {
   completedQuizzes.push(currentQuiz);
   localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
   
   markQuizCompleted(currentQuiz);
   updateUI();
   
   const modal = document.getElementById('quizModal');
   modal.style.transition = 'all 0.5s ease-out';
   modal.style.opacity = '0';
   modal.style.transform = 'scale(0.9)';
   
   setTimeout(() => {
       closeModal();
       modal.style.transition = '';
       modal.style.opacity = '';
       modal.style.transform = '';
       
       setTimeout(() => {
           startEndingSequence();
       }, 300);
   }, 500);
}

// 엔딩 시퀀스 시작
function startEndingSequence() {
   stopRoomTimer();
   
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
   
   setTimeout(() => {
       fadeOverlay.style.opacity = '1';
   }, 100);
   
   setTimeout(() => {
       document.getElementById('gameScreen').style.display = 'none';
       
       const endingScreen = document.getElementById('endingScreen');
       endingScreen.style.display = 'flex';
       endingScreen.style.opacity = '1';
       endingScreen.style.transform = 'scale(1.5)';
       endingScreen.classList.add('active');

       playBackgroundMusic();
       
       setTimeout(() => {
           fadeOverlay.style.opacity = '0';
           
           endingScreen.style.transition = 'transform 3s ease-out';
           endingScreen.style.transform = 'scale(1)';
           
           setTimeout(() => {
               if (fadeOverlay.parentNode) {
                   fadeOverlay.parentNode.removeChild(fadeOverlay);
               }
               
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
   
   playCompletionEffect();
   
   // ✨ 다음 오브젝트 활성화
   const roomOrder = roomObjectOrder[currentRoom];
   const completedIndex = roomOrder.indexOf(currentQuiz);
   
   if (completedIndex !== -1 && completedIndex < roomOrder.length - 1) {
       currentObjectIndex[currentRoom] = completedIndex + 1;
       localStorage.setItem('currentObjectIndex', JSON.stringify(currentObjectIndex));
       
       setTimeout(() => {
           activateCurrentObject();
       }, 1000);
   } else {
       checkRoomCompletion();
   }
}

// 오답 처리
function wrongAnswer() {
   showMessage("다시 입력해 주세요");
   
   const quiz = quizzes[currentQuiz];
   if (quiz.type === 'matching') {
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
   const className = objectClasses[quizId];
   const targetElement = document.querySelector(`.${className}`);
   
   if (targetElement) {
       targetElement.classList.remove('active');
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
   } else {
       document.getElementById('nextRoomBtn').style.display = 'none';
   }
}

// 방별 퀴즈 ID 반환
function getRoomQuizzes(roomNum) {
   return roomObjectOrder[roomNum] || [];
}

// 축하 효과 생성
function createCelebrationEffect() {
   for (let i = 0; i < 50; i++) {
       createConfetti();
   }
   
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
   
   setTimeout(() => {
       if (confetti.parentNode) {
           confetti.parentNode.removeChild(confetti);
       }
   }, 5000);
}

// 다음 방으로 이동
function nextRoom() {
   const nextRoomNum = currentRoom + 1;
   
   stopRoomTimer();
   
   const videoKey = `room${currentRoom}`;
   showTransitionWithVideo(videoKey, () => {
       document.getElementById(`room${currentRoom}`).classList.add('exit-left');
       
       setTimeout(() => {
           currentRoom = nextRoomNum;
           localStorage.setItem('currentRoom', currentRoom);
           
           // ✨ 다음 방의 오브젝트 인덱스 초기화
           if (!currentObjectIndex[currentRoom]) {
               currentObjectIndex[currentRoom] = 0;
           }
           
           showRoom(currentRoom);
           document.getElementById('nextRoomBtn').style.display = 'none';
           updateUI();
           
           // ✨ 미션 모달 표시
           showMissionModal(currentRoom, () => {
               activateCurrentObject();
               startRoomTimer();
           });
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

// 모달 닫기
function closeModal() {
   document.getElementById('quizModal').style.display = 'none';
   currentQuiz = null;
}

// 메시지 표시
function showMessage(text) {
   const message = document.createElement('div');
   message.className = 'message';
   message.textContent = text;
   message.style.cssText = `
       position: fixed;
       top: 50%;
       left: 50%;
       transform: translate(-50%, -50%);
       background: rgba(255, 0, 0, 0.9);
       color: white;
       padding: 1.5rem 2.5rem;
       border-radius: 1rem;
       font-size: 1.5rem;
       font-weight: bold;
       z-index: 10000;
       box-shadow: 0 4px 15px rgba(0,0,0,0.5);
   `;
   document.body.appendChild(message);
   
   setTimeout(() => {
       if (message.parentNode) {
           message.parentNode.removeChild(message);
       }
   }, 1500);
}

// 게임 재시작
function restartGame() {
   stopRoomTimer();
   stopBackgroundMusic();
   
   if (confettiInterval) {
       clearInterval(confettiInterval);
       confettiInterval = null;
   }
   
   const confettis = document.querySelectorAll('div[style*="confettiFall"]');
   confettis.forEach(confetti => {
       if (confetti.parentNode) {
           confetti.parentNode.removeChild(confetti);
       }
   });
   
   currentRoom = 1;
   completedQuizzes = [];
   currentQuiz = null;
   timeLeft = 600;
   isTimerActive = false;
   
   // ✨ 오브젝트 인덱스 초기화
   currentObjectIndex = { 1: 0, 2: 0, 3: 0 };
   
   localStorage.removeItem('completedQuizzes');
   localStorage.removeItem('currentRoom');
   localStorage.removeItem('gameCompleted');
   localStorage.removeItem('currentObjectIndex');
   
   document.querySelectorAll('.clickable').forEach(element => {
       element.classList.remove('completed');
       element.classList.remove('active');
       element.style.animation = '';
   });
   
   document.getElementById('endingScreen').classList.remove('active');
   document.getElementById('gameScreen').classList.remove('active');
   document.getElementById('gameOverScreen').classList.remove('active');
   document.getElementById('gameOverScreen').style.display = 'none';
   
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
   }, 1000);
}

// 비디오 포함 전환 효과
function showTransitionWithVideo(videoKey, callback) {
   const transition = document.getElementById('screenTransition');
   const video = document.getElementById('transitionVideo');
   video.muted = false;
   
   transition.classList.add('active');
   
   const videoSrc = transitionVideos[videoKey];
   let videoLoaded = false;
   let callbackExecuted = false;
   
   if (videoSrc) {
       video.removeEventListener('loadeddata', handleVideoLoad);
       video.removeEventListener('ended', handleVideoEnd);
       video.removeEventListener('error', handleVideoError);
       
       video.src = videoSrc;
       
       function handleVideoLoad() {
           videoLoaded = true;
           video.play().catch(e => {
               console.log('비디오 자동재생 실패:', e);
               executeCallback();
           });
       }
       
       function handleVideoEnd() {
           executeCallback();
       }
       
       function handleVideoError() {
           console.log('비디오 로드 실패');
           executeCallback();
       }
       
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
       
       video.addEventListener('loadeddata', handleVideoLoad, { once: true });
       video.addEventListener('ended', handleVideoEnd, { once: true });
       video.addEventListener('error', handleVideoError, { once: true });
       
       video.load();
       
       setTimeout(() => {
           if (!videoLoaded && !callbackExecuted) {
               console.log('비디오 로드 시간 초과');
               executeCallback();
           }
       }, 3000);
       
   } else {
       console.log('비디오 파일 없음');
       setTimeout(() => {
           if (callback) callback();
           setTimeout(() => {
               transition.classList.remove('active');
           }, 500);
       }, 1500);
   }
   
   setTimeout(() => {
       if (!callbackExecuted) {
           console.log('최대 대기 시간 초과');
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

// 페이지 로드 시 초기화
window.addEventListener('load', function() {
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
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('resumeScreen').style.display = 'flex';
        } else {
            document.getElementById('startScreen').style.display = 'flex';
        }
    }
});
