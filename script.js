// =========================================================
// SINF HUB — GOOGLE SHEETS CONNECTION
// =========================================================

const API_URL = "https://script.google.com/macros/s/AKfycby4wIoX37OFTMhdYTRae2S_A6K6ve5Kp9QouMkzeK6DgkB_pRvzm7sm32rqh4gjBjMv/exec";

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

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || "Server xatosi");
    }

    return result.data;
}


async function apiPost(action, data = {}) {

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },

        body: JSON.stringify({
            action,
            ...data
        })

    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || "Server xatosi");
    }

    return result;
}


// =========================================================
// GOOGLE SHEETS → LOCAL CACHE
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


        saveArray(
            "students",

            students.map(x => ({

                id: x.ID,

                name: x.Name,

                password: String(x.Password || "")

            }))

        );


        saveArray(
            "teachers",

            teachers.map(x => ({

                id: x.ID,

                name: x.Name,

                password: String(x.Password || "")

            }))

        );


        saveArray(
            "homeworks",

            homeworks.map(x => ({

                id: x.ID,

                subject: x.Subject,

                text: x.Text,

                date: x.Date,

                createdBy: x.CreatedBy

            }))

        );


        saveArray(
            "announcements",

            announcements.map(x => ({

                id: x.ID,

                title: x.Title,

                text: x.Text,

                date: x.Date,

                createdBy: x.CreatedBy

            }))

        );


        updateCounts();

        renderHomeworks();

        renderDashboardHomeworks();

        renderStudentDashboardHomeworks();

        renderStudents();

        renderTeachers();

        renderAnnouncements();


    } catch (error) {

        console.error(error);

    }

}


// =========================================================
// LOGIN
// =========================================================

teacherLogin = async function () {

    const name =
        prompt("O‘qituvchi loginini kiriting:");

    const password =
        prompt("Parolni kiriting:");


    if (!name || !password) {

        alert("⚠️ Login va parolni kiriting.");

        return;
    }


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


    try {

        const data =
            await apiGet("getTeachers");


        const teacher =
            data.find(x =>

                String(x.Name)
                    .toLowerCase() ===
                name.toLowerCase()

                &&

                String(x.Password) ===
                password

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

        alert(
            "❌ Server bilan ulanishda xato."
        );

    }

};


studentLogin = async function () {

    const name =
        prompt("O‘quvchi ismingizni kiriting:");

    const password =
        prompt("Parolingizni kiriting:");


    if (!name || !password) {

        alert(
            "⚠️ Ism va parolni kiriting."
        );

        return;
    }


    try {

        const data =
            await apiGet("getStudents");


        const student =
            data.find(x =>

                String(x.Name)
                    .toLowerCase() ===
                name.toLowerCase()

                &&

                String(x.Password) ===
                password

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

        alert(
            "❌ Server bilan ulanishda xato."
        );

    }

};


// =========================================================
// STUDENT
// =========================================================

saveStudent = async function () {

    if (currentUser.role !== "teacher") {
        return;
    }


    const name =
        document
            .getElementById("studentName")
            .value
            .trim();


    const password =
        document
            .getElementById("studentPassword")
            .value;


    if (!name || !password) {

        alert(
            "⚠️ Ism va parolni kiriting."
        );

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


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


deleteStudent = async function (index) {

    const students =
        getArray("students");


    const student =
        students[index];


    if (!student || !student.id) {
        return;
    }


    try {

        await apiPost(
            "deleteStudent",
            {
                id: student.id
            }
        );


        await loadDatabase();


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


// =========================================================
// TEACHER
// =========================================================

saveTeacher = async function () {

    if (currentUser.role !== "teacher") {
        return;
    }


    const name =
        document
            .getElementById("teacherName")
            .value
            .trim();


    const password =
        document
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


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


deleteTeacher = async function (index) {

    const teachers =
        getArray("teachers");


    const teacher =
        teachers[index];


    if (!teacher || !teacher.id) {
        return;
    }


    try {

        await apiPost(
            "deleteTeacher",
            {
                id: teacher.id
            }
        );


        await loadDatabase();


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


// =========================================================
// HOMEWORK
// =========================================================

saveHomework = async function () {

    if (currentUser.role !== "teacher") {
        return;
    }


    const subject =
        document
            .getElementById("subject")
            .value
            .trim();


    const text =
        document
            .getElementById("homeworkText")
            .value
            .trim();


    const date =
        document
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


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


deleteHomework = async function (index) {

    const homeworks =
        getArray("homeworks");


    const homework =
        homeworks[index];


    if (!homework || !homework.id) {
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


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


// =========================================================
// ANNOUNCEMENTS
// =========================================================

saveAnnouncement = async function () {

    if (currentUser.role !== "teacher") {
        return;
    }


    const title =
        document
            .getElementById(
                "announcementTitle"
            )
            .value
            .trim();


    const text =
        document
            .getElementById(
                "announcementText"
            )
            .value
            .trim();


    const date =
        document
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


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


deleteAnnouncement =
async function (index) {

    const announcements =
        getArray("announcements");


    const announcement =
        announcements[index];


    if (
        !announcement ||
        !announcement.id
    ) {
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


    } catch (error) {

        alert(
            "❌ " + error.message
        );

    }

};


// =========================================================
// PUBLIC CHAT
// =========================================================

async function loadOnlinePublicMessages() {

    try {

        const data =
            await apiGet(
                "getPublicMessages"
            );


        const messages =
            data.map(x => ({

                id: x.ID,

                sender: x.Sender,

                role: x.Role,

                text: x.Text,

                date:
                    formatServerTime(
                        x.CreatedAt
                    )

            }));


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

        console.error(error);

    }

}


sendPublicMessage =
async function (text) {

    try {

        await apiPost(
            "sendPublicMessage",
            {

                sender:
                    currentUser.name,

                role:
                    currentUser.role,

                text

            }
        );


        await loadOnlinePublicMessages();


    } catch (error) {

        alert(
            "❌ Xabar yuborilmadi."
        );

    }

};


// =========================================================
// PRIVATE CHAT
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
            data.map(x => ({

                id: x.ID,

                from: x.From,

                to: x.To,

                text: x.Text,

                date:
                    formatServerTime(
                        x.CreatedAt
                    )

            }));


        saveArray(
            "privateMessages",
            messages
        );


        renderPrivateMessages();


    } catch (error) {

        console.error(error);

    }

}


sendPrivateMessage =
async function (text) {

    if (!selectedPrivateUser) {

        alert(
            "⚠️ Avval suhbatdoshni tanlang."
        );

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

                text

            }
        );


        await loadOnlinePrivateMessages();


    } catch (error) {

        alert(
            "❌ Xabar yuborilmadi."
        );

    }

};


// =========================================================
// CHAT OPEN
// =========================================================

const oldOpenChat =
    openChat;


openChat =
async function () {

    oldOpenChat();

    await loadDatabase();

    await loadOnlinePublicMessages();

};


const oldOpenPublicChat =
    openPublicChat;


openPublicChat =
async function () {

    oldOpenPublicChat();

    await loadOnlinePublicMessages();

};


const oldSelectPrivateConversation =
    selectPrivateConversation;


selectPrivateConversation =
async function () {

    oldSelectPrivateConversation();

    await loadOnlinePrivateMessages();

};


// =========================================================
// SERVER TIME
// =========================================================

function formatServerTime(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleTimeString(
        [],
        {

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


// =========================================================
// AUTO UPDATE
// =========================================================

setInterval(
    async function () {

        if (!currentUser.name) {
            return;
        }


        await loadDatabase();


        const chat =
            document.getElementById(
                "chatWorkspace"
            );


        if (
            !chat ||
            chat.classList.contains(
                "hidden"
            )
        ) {

            return;

        }


        if (
            currentChatMode ===
            "public"
        ) {

            await loadOnlinePublicMessages();

        }

        else if (
            selectedPrivateUser
        ) {

            await loadOnlinePrivateMessages();

        }

    },

    5000
);


// =========================================================
// INITIAL DATABASE LOAD
// =========================================================

loadDatabase();