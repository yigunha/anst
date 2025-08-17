// Supabase 클라이언트 설정 (학생, 선생님 페이지 공용)
const SUPABASE_URL = "https://svlqqkfkmevcjssarpng.supabase.co"';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bHFxa2ZrbWV2Y2pzc2FycG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjE5MDUsImV4cCI6MjA2NjQzNzkwNX0.bB8oanmqsBtoL3H4xwczP6khaojvnu02VWmtm0xY_yM";
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 페이지의 타이틀에 따라 다른 로직을 실행
if (document.title.includes('학생 답변')) {
    // ====== 학생 페이지 관련 코드 ======
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    const userHeading = document.getElementById('user-heading');
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    const messageDiv = document.getElementById('message');

    if (!userId) {
        userHeading.innerText = '사용자 번호를 입력해주세요.';
        answerInput.disabled = true;
        submitBtn.disabled = true;
    } else {
        userHeading.innerText = `사용자 ${userId}`;
        checkSubmissionStatus();
    }

    async function checkSubmissionStatus() {
        const hasSubmitted = localStorage.getItem(`submitted_${userId}`);
        if (hasSubmitted) {
            disableInput('이미 답변을 제출했습니다.');
        }
    }

    function disableInput(msg) {
        answerInput.disabled = true;
        submitBtn.disabled = true;
        messageDiv.innerText = msg;
        messageDiv.style.color = '#dc3545';
    }

    submitBtn.addEventListener('click', async () => {
        const sentence = answerInput.value.trim();
        if (sentence === '') {
            messageDiv.innerText = '답변을 입력해주세요.';
            messageDiv.style.color = '#dc3545';
            return;
        }

        try {
            const { error } = await supabase
                .from('answers_surabaya')
                .insert([{ user_id: userId, sentence: sentence }]);

            if (error) throw error;

            messageDiv.innerText = '답변이 성공적으로 제출되었습니다!';
            messageDiv.style.color = '#28a745';
            localStorage.setItem(`submitted_${userId}`, 'true');
            disableInput('');
        } catch (error) {
            console.error(error);
            messageDiv.innerText = '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
            messageDiv.style.color = '#dc3545';
        }
    });

} else if (document.title.includes('선생님 관리')) {
    // ====== 선생님 페이지 관련 코드 ======
    const tableBody = document.getElementById('answers-table-body');
    const selectAllCheckbox = document.getElementById('select-all');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const downloadBtn = document.getElementById('download-btn');

    async function fetchAnswers() {
        const { data: answers, error } = await supabase
            .from('answers_surabaya')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching data:', error);
            return;
        }
        renderTable(answers);
    }

    function renderTable(answers) {
        tableBody.innerHTML = '';
        if (answers.length === 0) {
            tableBody.innerHTML = '<tr class="no-data"><td colspan="4">데이터가 없습니다.</td></tr>';
            return;
        }

        answers.forEach(answer => {
            const row = document.createElement('tr');
            const formattedTime = new Date(answer.created_at).toLocaleString();
            row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" data-id="${answer.id}"></td>
                <td>${answer.user_id}</td>
                <td>${answer.sentence}</td>
                <td>${formattedTime}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 실시간 업데이트 설정
    supabase
        .channel('answers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'answers_surabaya' }, (payload) => {
            fetchAnswers();
        })
        .subscribe();

    // 전체 삭제 기능
    clearAllBtn.addEventListener('click', async () => {
        if (confirm('모든 학생의 답변을 정말로 삭제하시겠습니까?')) {
            const { error } = await supabase
                .from('answers_surabaya')
                .delete()
                .not('id', 'is', null);

            if (error) {
                console.error('Error deleting all answers:', error);
            } else {
                alert('모든 답변이 삭제되었습니다.');
                fetchAnswers();
            }
        }
    });

    // 선택 삭제 기능
    deleteSelectedBtn.addEventListener('click', async () => {
        const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);

        if (selectedIds.length === 0) {
            alert('삭제할 항목을 선택해주세요.');
            return;
        }

        if (confirm(`${selectedIds.length}개의 항목을 삭제하시겠습니까?`)) {
            const { error } = await supabase
                .from('answers_surabaya')
                .delete()
                .in('id', selectedIds);

            if (error) {
                console.error('Error deleting selected answers:', error);
            } else {
                alert('선택된 항목이 삭제되었습니다.');
                fetchAnswers();
            }
        }
    });

    // 모두 선택/선택 해제 기능
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    });

    // CSV 다운로드 기능
    downloadBtn.addEventListener('click', () => {
        const table = document.querySelector('table');
        const rows = table.querySelectorAll('tr');
        let csv = [];
        for (let i = 0; i < rows.length; i++) {
            const row = [], cols = rows[i].querySelectorAll('th, td');
            for (let j = 1; j < cols.length; j++) {
                let data = cols[j].innerText.replace(/"/g, '""');
                if (data.includes(',') || data.includes('\n') || data.includes('"')) {
                    data = `"${data}"`;
                }
                row.push(data);
            }
            csv.push(row.join(','));
        }
        const csvString = csv.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "student_answers.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // 페이지 로드 시 데이터 가져오기
    fetchAnswers();
}