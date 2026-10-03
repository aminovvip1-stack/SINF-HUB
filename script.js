// =========================================================
// SINF HUB — GOOGLE SHEETS CONNECTION
// 1-QISM
// =========================================================

const API_URL =
    "https://script.google.com/macros/s/AKfycby4wIoX37OFTMhdYTRae2S_A6K6ve5Kp9QouMkzeK6DgkB_pRvzm7sm32rqh4gjBjMv/exec";


// =========================================================
// API GET
// =========================================================

async function apiGet(action, params = {}) {

    const url = new URL(API_URL);

    url.searchParams.set("action", action);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            "Server bilan bog‘lanishda xato."
        );
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            result.error || "Server xatosi"
        );
    }

    return result.data;
}


// =========================================================
// API POST
// =========================================================

async function apiPost(action, data = {}) {

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type":
                "text/plain;charset=utf-8"
        },

        body: JSON.stringify({
            action,
            ...data
        })

    });

    if (!response.ok) {
        throw new Error(
            "Server bilan bog‘lanishda xato."
        );
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            result.error || "Server xatosi"
        );
    }

    return result;
}


// =========================================================
// GOOGLE SHEETS → BRAUZER
// =========================================================

async function loadDatabase() {

    try {

        const [
            students,
            teachers,
            homeworks,
            announcements
        ] = await Promise.all([

            apiGet("getStudents"),

            apiGet("getTeachers"),

            apiGet("getHomeworks"),

            apiGet("getAnnouncements")

        ]);


        // -------------------------
        // STUDENTS
        // -------------------------

        saveArray(
            "students",

            students.map(student => ({

                id:
                    student.ID,

                name:
                    student.Name,

                password:
                    String(
                        student.Password || ""
                    )

            }))

        );


        // -------------------------
        // TEACHERS
        // -------------------------

        saveArray(
            "teachers",

            teachers.map(teacher => ({

                id:
                    teacher.ID,

                name:
                    teacher.Name,

                password:
                    String(
                        teacher.Password || ""
                    )

            }))

        );


        // -------------------------
        // HOMEWORKS
        // -------------------------

        saveArray(
            "homeworks",

            homeworks.map(homework => ({

                id:
                    homework.ID,

                subject:
                    homework.Subject,

                text:
                    homework.Text,

                date:
                    homework.Date,

                createdBy:
                    homework.CreatedBy

            }))

        );


        // -------------------------
        // ANNOUNCEMENTS
        // -------------------------

        saveArray(
            "announcements",

            announcements.map(
                announcement => ({

                    id:
                        announcement.ID,

                    title:
                        announcement.Title,

                    text:
                        announcement.Text,

                    date:
                        announcement.Date,

                    createdBy:
                        announcement.CreatedBy

                })
            )

        );


        console.log(
            "✅ Google Sheets ma'lumotlari yuklandi."
        );

        return true;


    } catch (error) {

        console.error(
            "❌ Google Sheets:",
            error
        );

        return false;

    }

}


// =========================================================
// SERVER VAQTINI KO‘RSATISH
// =========================================================

function formatServerTime(value) {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleTimeString(
        "uz-UZ",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =========================================================
// SERVER SANASINI KO‘RSATISH
// =========================================================

function formatServerDate(value) {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "uz-UZ"
    );

}
// =========================================================
// SINF HUB — GOOGLE SHEETS
// 2-QISM — STUDENTS + TEACHERS
// =========================================================


// =========================================================
// O‘QUVCHI QO‘SHISH
// =========================================================

saveStudent = async function () {

    if (currentUser.role !== "teacher") {
        return;
    }

    const name = document
        .getElementById("studentName")
        .value
        .trim();

    const password = document
        .getElementById("studentPassword")
        .value;

    if (!name || !password) {
        alert("⚠️ Ism va parolni kiriting.");
        return;
    }

    try {

        await apiPost(
            "addStudent",
            {
                name,
                password
            }
        );

        document
            .getElementById("studentName")
            .value = "";

        document
            .getElementById("studentPassword")
            .value = "";

        closeStudentModal();

        await loadDatabase();

        renderStudents();
        updateCounts();

        if (typeof loadChatUsers === "function") {
            loadChatUsers();
        }

        alert("✅ O‘quvchi Google Sheets'ga saqlandi.");

    } catch (error) {

        console.error(error);

        alert(
            "❌ O‘quvchi saqlanmadi: " +
            error.message
        );
    }
};


// =========================================================
// O‘QUVCHINI O‘CHIRISH
// =========================================================

deleteStudent = async function (index) {

    if (currentUser.role !== "teacher") {
        return;
    }

    const students = getArray("students");

    const student = students[index];

    if (!student) {
        return;
    }

    if (!student.id) {

        alert(
            "⚠️ Bu eski lokal o‘quvchi. " +
            "Sahifani yangilab qayta urinib ko‘ring."
        );

        return;
    }

    try {

        await apiPost(
            "deleteStudent",
            {
                id: student.id
            }
        );

        const profiles = getProfiles();

        delete profiles[
            profileKey(student.name)
        ];

        saveProfiles(profiles);

        await loadDatabase();

        renderStudents();
        updateCounts();

        if (typeof loadChatUsers === "function") {
            loadChatUsers();
        }

    } catch (error) {

        console.error(error);

        alert(
            "❌ O‘quvchini o‘chirib bo‘lmadi: " +
            error.message
        );
    }
};


// =========================================================
// O‘QITUVCHI QO‘SHISH
// =========================================================

saveTeacher = async function () {

    if (currentUser.role !== "teacher") {
        return;
    }

    const name = document
        .getElementById("teacherName")
        .value
        .trim();

    const password = document
        .getElementById(
            "teacherNewPassword"
        )
        .value;

    if (!name || !password) {

        alert(
            "⚠️ Ism va parolni kiriting."
        );

        return;
    }

    try {

        await apiPost(
            "addTeacher",
            {
                name,
                password
            }
        );

        document
            .getElementById("teacherName")
            .value = "";

        document
            .getElementById(
                "teacherNewPassword"
            )
            .value = "";

        closeTeacherModal();

        await loadDatabase();

        renderTeachers();
        updateCounts();

        if (typeof loadChatUsers === "function") {
            loadChatUsers();
        }

        alert(
            "✅ O‘qituvchi Google Sheets'ga saqlandi."
        );

    } catch (error) {

        console.error(error);

        alert(
            "❌ O‘qituvchi saqlanmadi: " +
            error.message
        );
    }
};


// =========================================================
// O‘QITUVCHINI O‘CHIRISH
// =========================================================

deleteTeacher = async function (index) {

    if (currentUser.role !== "teacher") {
        return;
    }

    const teachers = getArray("teachers");

    const teacher = teachers[index];

    if (!teacher) {
        return;
    }

    if (!teacher.id) {

        alert(
            "⚠️ Bu eski lokal o‘qituvchi. " +
            "Sahifani yangilab qayta urinib ko‘ring."
        );

        return;
    }

    try {

        await apiPost(
            "deleteTeacher",
            {
                id: teacher.id
            }
        );

        const profiles = getProfiles();

        delete profiles[
            profileKey(teacher.name)
        ];

        saveProfiles(profiles);

        await loadDatabase();

        renderTeachers();
        updateCounts();

        if (typeof loadChatUsers === "function") {
            loadChatUsers();
        }

    } catch (error) {

        console.error(error);

        alert(
            "❌ O‘qituvchini o‘chirib bo‘lmadi: " +
            error.message
        );
    }
};
// =========================================================
// SINF HUB — GOOGLE SHEETS
// 3-QISM — PUBLIC + PRIVATE CHAT
// =========================================================

let chatSyncTimer = null;
let lastPublicMessageId = "";
let lastPrivateMessageId = "";


// =========================================================
// PUBLIC CHATNI SERVERDAN YUKLASH
// =========================================================

async function loadOnlinePublicMessages() {

    try {

        const data =
            await apiGet(
                "getPublicMessages"
            );

        const messages =
            data.map(message => ({

                id:
                    message.ID,

                sender:
                    message.Sender,

                role:
                    message.Role,

                text:
                    message.Text,

                date:
                    formatServerTime(
                        message.CreatedAt
                    )

            }));


        // Yangi xabar kelganini tekshiramiz

        const newest =
            messages[
                messages.length - 1
            ];

        if (
            newest &&
            lastPublicMessageId &&
            newest.id !==
                lastPublicMessageId &&
            newest.sender !==
                currentUser.name
        ) {

            playMessageSound();

        }


        if (newest) {

            lastPublicMessageId =
                newest.id;

        }


        saveArray(
            "publicMessages",
            messages
        );


        if (
            currentChatMode ===
            "public"
        ) {

            renderPublicMessages();

        }

    } catch (error) {

        console.error(
            "Public chat yuklanmadi:",
            error
        );

    }

}


// =========================================================
// PUBLIC XABAR YUBORISH
// =========================================================

sendPublicMessage =
async function (text) {

    if (!currentUser.name) {
        return;
    }

    const cleanText =
        String(text || "").trim();

    if (!cleanText) {
        return;
    }

    try {

        await apiPost(
            "sendPublicMessage",
            {

                sender:
                    currentUser.name,

                role:
                    currentUser.role,

                text:
                    cleanText

            }
        );


        await loadOnlinePublicMessages();


    } catch (error) {

        console.error(error);

        alert(
            "❌ Xabar yuborilmadi: " +
            error.message
        );

    }

};


// =========================================================
// PRIVATE CHATNI SERVERDAN YUKLASH
// =========================================================

async function loadOnlinePrivateMessages() {

    if (
        !currentUser.name ||
        !selectedPrivateUser
    ) {

        return;

    }


    try {

        const data =
            await apiGet(
                "getPrivateMessages",
                {

                    user1:
                        currentUser.name,

                    user2:
                        selectedPrivateUser

                }
            );


        const messages =
            data.map(message => ({

                id:
                    message.ID,

                from:
                    message.From,

                to:
                    message.To,

                text:
                    message.Text,

                date:
                    formatServerTime(
                        message.CreatedAt
                    )

            }));


        // Yangi private xabarni tekshiramiz

        const newest =
            messages[
                messages.length - 1
            ];


        if (
            newest &&
            lastPrivateMessageId &&
            newest.id !==
                lastPrivateMessageId &&
            newest.from !==
                currentUser.name
        ) {

            playMessageSound();

        }


        if (newest) {

            lastPrivateMessageId =
                newest.id;

        }


        saveArray(
            "privateMessages",
            messages
        );


        if (
            currentChatMode ===
            "private"
        ) {

            renderPrivateMessages();

        }


    } catch (error) {

        console.error(
            "Private chat yuklanmadi:",
            error
        );

    }

}


// =========================================================
// PRIVATE XABAR YUBORISH
// =========================================================

sendPrivateMessage =
async function (text) {

    if (!selectedPrivateUser) {

        alert(
            "⚠️ Avval suhbatdoshni tanlang."
        );

        return;

    }


    const cleanText =
        String(text || "").trim();


    if (!cleanText) {
        return;
    }


    try {

        await apiPost(
            "sendPrivateMessage",
            {

                from:
                    currentUser.name,

                to:
                    selectedPrivateUser,

                text:
                    cleanText

            }
        );


        await loadOnlinePrivateMessages();


    } catch (error) {

        console.error(error);

        alert(
            "❌ Xabar yuborilmadi: " +
            error.message
        );

    }

};


// =========================================================
// XABAR OVOZI
// =========================================================

function playMessageSound() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {
            return;
        }


        const context =
            new AudioContext();


        const oscillator =
            context.createOscillator();


        const gain =
            context.createGain();


        oscillator.connect(gain);

        gain.connect(
            context.destination
        );


        oscillator.frequency.value =
            650;


        gain.gain.setValueAtTime(
            0.08,
            context.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + 0.15
        );


        oscillator.start();

        oscillator.stop(
            context.currentTime + 0.15
        );


    } catch (error) {

        console.log(
            "Ovoz ishlamadi:",
            error
        );

    }

}


// =========================================================
// CHATNI HAR 4 SONIYADA YANGILASH
// =========================================================

function startChatSync() {

    stopChatSync();


    chatSyncTimer =
        setInterval(
            async () => {

                if (!currentUser.name) {
                    return;
                }


                if (
                    currentChatMode ===
                    "public"
                ) {

                    await loadOnlinePublicMessages();

                }


                if (
                    currentChatMode ===
                    "private" &&
                    selectedPrivateUser
                ) {

                    await loadOnlinePrivateMessages();

                }

            },

            4000
        );

}


// =========================================================
// CHAT SYNCNI TO‘XTATISH
// =========================================================

function stopChatSync() {

    if (chatSyncTimer) {

        clearInterval(
            chatSyncTimer
        );

        chatSyncTimer = null;

    }

}


// =========================================================
// ESKI OPENCHATNI SAQLAB QOLAMIZ
// =========================================================

const sinfHubOldOpenChat =
    openChat;


openChat =
async function () {

    sinfHubOldOpenChat();

    await loadDatabase();

    await loadOnlinePublicMessages();

    startChatSync();

};


// =========================================================
// PUBLIC CHATGA O‘TISH
// =========================================================

if (
    typeof openPublicChat ===
    "function"
) {

    const sinfHubOldOpenPublicChat =
        openPublicChat;


    openPublicChat =
    async function () {

        sinfHubOldOpenPublicChat();

        currentChatMode =
            "public";

        await loadOnlinePublicMessages();

        startChatSync();

    };

}


// =========================================================
// PRIVATE SUHBAT TANLANGANDA
// =========================================================

if (
    typeof selectPrivateConversation ===
    "function"
) {

    const sinfHubOldSelectPrivate =
        selectPrivateConversation;


    selectPrivateConversation =
    async function (...args) {

        sinfHubOldSelectPrivate(
            ...args
        );

        currentChatMode =
            "private";

        lastPrivateMessageId =
            "";

        await loadOnlinePrivateMessages();

        startChatSync();

    };

}
// =========================================================
// SINF HUB
// 4-QISM — LOGIN SESSION / REFRESH
// =========================================================

const SINF_SESSION_KEY = "sinfHubSession";


// =========================================================
// SESSION SAQLASH
// =========================================================

function saveSinfSession(name, role) {

    if (!name || !role) {
        return;
    }

    localStorage.setItem(
        SINF_SESSION_KEY,
        JSON.stringify({
            name: name,
            role: role
        })
    );
}


// =========================================================
// SESSIONNI O‘QISH
// =========================================================

function getSinfSession() {

    try {

        const saved =
            localStorage.getItem(
                SINF_SESSION_KEY
            );

        if (!saved) {
            return null;
        }

        const session =
            JSON.parse(saved);

        if (
            !session ||
            !session.name ||
            !session.role
        ) {
            return null;
        }

        return session;

    } catch (error) {

        console.error(
            "Session o‘qishda xato:",
            error
        );

        return null;
    }
}


// =========================================================
// SESSIONNI O‘CHIRISH
// =========================================================

function clearSinfSession() {

    localStorage.removeItem(
        SINF_SESSION_KEY
    );

}


// =========================================================
// LOGIN SUCCESS FUNKSIYASINI KUCHAYTIRAMIZ
// =========================================================

const sinfHubOldLoginSuccess =
    loginSuccess;


loginSuccess =
function (name, role) {

    sinfHubOldLoginSuccess(
        name,
        role
    );

    saveSinfSession(
        name,
        role
    );

};


// =========================================================
// REFRESHDAN KEYIN LOGINNI TIKLASH
// =========================================================

async function restoreSinfSession() {

    const session =
        getSinfSession();


    if (!session) {
        return;
    }


    try {

        // Avval Google Sheets ma'lumotlarini olamiz
        await loadDatabase();


        // Foydalanuvchini qayta tiklaymiz
        sinfHubOldLoginSuccess(
            session.name,
            session.role
        );


        // Sessionni yangilab qo‘yamiz
        saveSinfSession(
            session.name,
            session.role
        );


        console.log(
            "✅ Login session tiklandi:",
            session.name
        );


    } catch (error) {

        console.error(
            "Session tiklanmadi:",
            error
        );

    }

}


// =========================================================
// LOGOUTNI HAM SESSION BILAN BOG‘LAYMIZ
// =========================================================

if (
    typeof logout ===
    "function"
) {

    const sinfHubOldLogout =
        logout;


    logout =
    function (...args) {

        clearSinfSession();

        stopChatSync();

        return sinfHubOldLogout(
            ...args
        );

    };

}


// =========================================================
// AGAR FUNKSIYA logoutUser DEB NOMLANGAN BO‘LSA
// =========================================================

if (
    typeof logoutUser ===
    "function"
) {

    const sinfHubOldLogoutUser =
        logoutUser;


    logoutUser =
    function (...args) {

        clearSinfSession();

        stopChatSync();

        return sinfHubOldLogoutUser(
            ...args
        );

    };

}


// =========================================================
// SAHIFA OCHILGANDA SESSIONNI TIKLASH
// =========================================================

window.addEventListener(
    "load",
    async function () {

        await restoreSinfSession();

    }
);
// =========================================================
// SINF HUB
// 5-QISM — ONLINE LOGIN
// =========================================================


// =========================================================
// O‘QITUVCHI LOGIN
// =========================================================

teacherLogin = async function () {

    const name =
        prompt("O‘qituvchi loginini kiriting:");

    const password =
        prompt("Parolni kiriting:");


    if (!name || !password) {

        alert(
            "⚠️ Login va parolni kiriting."
        );

        return;
    }


    // ASOSIY O‘QITUVCHI
    if (
        name.toLowerCase() ===
            MAIN_TEACHER.name.toLowerCase()
        &&
        password ===
            MAIN_TEACHER.password
    ) {

        await loadDatabase();

        loginSuccess(
            MAIN_TEACHER.name,
            "teacher"
        );

        return;
    }


    // GOOGLE SHEETS O‘QITUVCHILARI
    try {

        const teachers =
            await apiGet(
                "getTeachers"
            );


        const teacher =
            teachers.find(item =>

                String(item.Name || "")
                    .toLowerCase() ===
                name.toLowerCase()

                &&

                String(
                    item.Password || ""
                ) === password

            );


        if (!teacher) {

            alert(
                "❌ Login yoki parol noto‘g‘ri."
            );

            return;
        }


        await loadDatabase();


        loginSuccess(
            teacher.Name,
            "teacher"
        );


    } catch (error) {

        console.error(
            "Teacher login:",
            error
        );


        alert(
            "❌ Server bilan ulanishda xato."
        );

    }

};


// =========================================================
// O‘QUVCHI LOGIN
// =========================================================

studentLogin = async function () {

    const name =
        prompt(
            "O‘quvchi ismingizni kiriting:"
        );


    const password =
        prompt(
            "Parolingizni kiriting:"
        );


    if (!name || !password) {

        alert(
            "⚠️ Ism va parolni kiriting."
        );

        return;
    }


    try {

        const students =
            await apiGet(
                "getStudents"
            );


        const student =
            students.find(item =>

                String(item.Name || "")
                    .toLowerCase() ===
                name.toLowerCase()

                &&

                String(
                    item.Password || ""
                ) === password

            );


        if (!student) {

            alert(
                "❌ Ism yoki parol noto‘g‘ri."
            );

            return;
        }


        await loadDatabase();


        loginSuccess(
            student.Name,
            "student"
        );


    } catch (error) {

        console.error(
            "Student login:",
            error
        );


        alert(
            "❌ Server bilan ulanishda xato."
        );

    }

};


// =========================================================
// SAYT OCHILGANDA DATABASE YUKLASH
// =========================================================

window.addEventListener(
    "load",

    async function () {

        try {

            await loadDatabase();

        } catch (error) {

            console.error(
                "Database boshlanishida xato:",
                error
            );

        }

    }
);
// =========================================================
// SINF HUB
// 6-QISM — HOMEWORK + ANNOUNCEMENTS
// =========================================================


// =========================================================
// UY VAZIFASINI SAQLASH
// =========================================================

saveHomework = async function () {

    if (currentUser.role !== "teacher") {
        return;
    }

    const subject = document
        .getElementById("subject")
        .value
        .trim();

    const text = document
        .getElementById("homeworkText")
        .value
        .trim();

    const date = document
        .getElementById("homeworkDate")
        .value;


    if (!subject || !text || !date) {

        alert(
            "⚠️ Barcha joylarni to‘ldiring."
        );

        return;
    }


    try {

        await apiPost(
            "addHomework",
            {
                subject,
                text,
                date,
                createdBy:
                    currentUser.name
            }
        );


        document
            .getElementById("subject")
            .value = "";

        document
            .getElementById("homeworkText")
            .value = "";

        document
            .getElementById("homeworkDate")
            .value = "";


        closeHomeworkModal();


        await loadDatabase();


        renderHomeworks();

        renderDashboardHomeworks();

        renderStudentDashboardHomeworks();

        updateCounts();


        alert(
            "✅ Uy vazifasi Google Sheets'ga saqlandi."
        );


    } catch (error) {

        console.error(error);

        alert(
            "❌ Uy vazifasi saqlanmadi: " +
            error.message
        );

    }

};


// =========================================================
// UY VAZIFASINI O‘CHIRISH
// =========================================================

deleteHomework =
async function (index) {

    if (currentUser.role !== "teacher") {
        return;
    }


    const homeworks =
        getArray("homeworks");


    const homework =
        homeworks[index];


    if (!homework) {
        return;
    }


    if (!homework.id) {

        alert(
            "⚠️ Bu eski lokal vazifa. " +
            "Sahifani yangilab qayta urinib ko‘ring."
        );

        return;
    }


    try {

        await apiPost(
            "deleteHomework",
            {
                id: homework.id
            }
        );


        await loadDatabase();


        renderHomeworks();

        renderDashboardHomeworks();

        renderStudentDashboardHomeworks();

        updateCounts();


    } catch (error) {

        console.error(error);

        alert(
            "❌ Vazifa o‘chirilmadi: " +
            error.message
        );

    }

};


// =========================================================
// E’LONNI SAQLASH
// =========================================================

saveAnnouncement =
async function () {

    if (currentUser.role !== "teacher") {
        return;
    }


    const title = document
        .getElementById(
            "announcementTitle"
        )
        .value
        .trim();


    const text = document
        .getElementById(
            "announcementText"
        )
        .value
        .trim();


    const date = document
        .getElementById(
            "announcementDate"
        )
        .value;


    if (!title || !text || !date) {

        alert(
            "⚠️ Barcha joylarni to‘ldiring."
        );

        return;
    }


    try {

        await apiPost(
            "addAnnouncement",
            {
                title,
                text,
                date,
                createdBy:
                    currentUser.name
            }
        );


        document
            .getElementById(
                "announcementTitle"
            )
            .value = "";


        document
            .getElementById(
                "announcementText"
            )
            .value = "";


        document
            .getElementById(
                "announcementDate"
            )
            .value = "";


        closeAnnouncementModal();


        await loadDatabase();


        renderAnnouncements();

        updateCounts();


        alert(
            "✅ E’lon Google Sheets'ga saqlandi."
        );


    } catch (error) {

        console.error(error);

        alert(
            "❌ E’lon saqlanmadi: " +
            error.message
        );

    }

};


// =========================================================
// E’LONNI O‘CHIRISH
// =========================================================

deleteAnnouncement =
async function (index) {

    if (currentUser.role !== "teacher") {
        return;
    }


    const announcements =
        getArray("announcements");


    const announcement =
        announcements[index];


    if (!announcement) {
        return;
    }


    if (!announcement.id) {

        alert(
            "⚠️ Bu eski lokal e’lon. " +
            "Sahifani yangilab qayta urinib ko‘ring."
        );

        return;
    }


    try {

        await apiPost(
            "deleteAnnouncement",
            {
                id:
                    announcement.id
            }
        );


        await loadDatabase();


        renderAnnouncements();

        updateCounts();


    } catch (error) {

        console.error(error);

        alert(
            "❌ E’lon o‘chirilmadi: " +
            error.message
        );

    }

};