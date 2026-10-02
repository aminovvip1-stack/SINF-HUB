// =========================================================
// SINF HUB — SCRIPT.JS
// =========================================================


// =========================================================
// MAIN TEACHER
// =========================================================

const MAIN_TEACHER = {
    name: "AMINOVAMIR",
    password: "676869"
};


// =========================================================
// CURRENT STATE
// =========================================================

let currentUser = {
    name: "",
    role: ""
};

let currentChatMode = "public";
let selectedPrivateUser = "";
let pendingProfilePhoto = null;


// =========================================================
// STORAGE
// =========================================================

function getArray(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}


function saveArray(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}


function getProfiles() {
    try {
        return JSON.parse(localStorage.getItem("profiles")) || {};
    } catch {
        return {};
    }
}


function saveProfiles(profiles) {
    localStorage.setItem("profiles", JSON.stringify(profiles));
}


function profileKey(name) {
    return String(name || "")
        .trim()
        .toLowerCase();
}


// =========================================================
// SMALL HELPERS
// =========================================================

function show(id) {
    const element = document.getElementById(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


function hide(id) {
    const element = document.getElementById(id);

    if (element) {
        element.classList.add("hidden");
    }
}


function setText(id, text) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = text;
    }
}


function getFirstLetter(name) {
    const text = String(name || "?").trim();

    if (!text) {
        return "?";
    }

    return text.charAt(0).toUpperCase();
}


function getAvatarColor(name) {
    const colors = [
        "#2563eb",
        "#7c3aed",
        "#db2777",
        "#ea580c",
        "#059669",
        "#0891b2",
        "#4f46e5",
        "#dc2626",
        "#16a34a",
        "#9333ea"
    ];

    let hash = 0;

    const text = String(name || "?");

    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}


// =========================================================
// PROFILE PHOTO
// =========================================================

function getProfilePhoto(name) {
    const profiles = getProfiles();

    const profile = profiles[profileKey(name)];

    return profile?.photo || null;
}


function renderAvatar(element, name) {
    if (!element) {
        return;
    }

    const photo = getProfilePhoto(name);

    element.innerHTML = "";

    if (photo) {
        const image = document.createElement("img");

        image.src = photo;
        image.alt = "";

        element.appendChild(image);

        element.style.background = "#e2e8f0";
    } else {
        element.textContent = getFirstLetter(name);
        element.style.background = getAvatarColor(name);
        element.style.color = "white";
    }
}


function createAvatar(name, className = "avatar avatar-medium") {
    const avatar = document.createElement("div");

    avatar.className = className;

    renderAvatar(avatar, name);

    return avatar;
}


// =========================================================
// LOGIN
// =========================================================

function teacherLogin() {
    const name = prompt("O‘qituvchi loginini kiriting:");
    const password = prompt("Parolni kiriting:");

    if (!name || !password) {
        alert("⚠️ Login va parolni kiriting.");
        return;
    }

    if (
        name.toLowerCase() === MAIN_TEACHER.name.toLowerCase() &&
        password === MAIN_TEACHER.password
    ) {
        loginSuccess(MAIN_TEACHER.name, "teacher");
        return;
    }

    const teachers = getArray("teachers");

    const teacher = teachers.find(item =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.password === password
    );

    if (!teacher) {
        alert("❌ Login yoki parol noto‘g‘ri.");
        return;
    }

    loginSuccess(teacher.name, "teacher");
}


function studentLogin() {
    const name = prompt("O‘quvchi ismingizni kiriting:");
    const password = prompt("Parolingizni kiriting:");

    if (!name || !password) {
        alert("⚠️ Ism va parolni kiriting.");
        return;
    }

    const students = getArray("students");

    const student = students.find(item =>
        item.name.toLowerCase() === name.toLowerCase() &&
        item.password === password
    );

    if (!student) {
        alert("❌ Ism yoki parol noto‘g‘ri.");
        return;
    }

    loginSuccess(student.name, "student");
}


function loginSuccess(name, role) {
    currentUser = {
        name,
        role
    };

    hide("homePage");
    show("appShell");

    if (role === "teacher") {
        show("teacherNavigation");
        hide("studentNavigation");

        show("addHomeworkButton");
        show("addAnnouncementButton");

        showTeacherDashboard();
    } else {
        hide("teacherNavigation");
        show("studentNavigation");

        hide("addHomeworkButton");
        hide("addAnnouncementButton");

        setText(
            "studentGreeting",
            `Xush kelibsiz, ${name}! 👋`
        );

        showStudentDashboard();
    }

    updateUserUI();
    updateCounts();
}


// =========================================================
// LOGOUT
// =========================================================

function logout() {
    currentUser = {
        name: "",
        role: ""
    };

    currentChatMode = "public";
    selectedPrivateUser = "";
    pendingProfilePhoto = null;

    hide("appShell");
    hide("chatWorkspace");
    hide("profileModal");

    show("homePage");
}


// =========================================================
// USER UI
// =========================================================

function updateUserUI() {
    if (!currentUser.name) {
        return;
    }

    setText("sidebarUserName", currentUser.name);

    setText(
        "sidebarUserRole",
        currentUser.role === "teacher"
            ? "O‘qituvchi"
            : "O‘quvchi"
    );

    renderAvatar(
        document.getElementById("sidebarAvatar"),
        currentUser.name
    );

    renderAvatar(
        document.getElementById("mobileAvatar"),
        currentUser.name
    );
}


// =========================================================
// PAGE NAVIGATION
// =========================================================

const PAGE_IDS = [
    "teacherDashboard",
    "studentDashboard",
    "homeworkSection",
    "studentsSection",
    "teachersSection",
    "announcementsSection"
];


function hideAllPages() {
    PAGE_IDS.forEach(hide);
}


function showTeacherDashboard() {
    hideAllPages();
    show("teacherDashboard");

    updateCounts();
    renderDashboardHomeworks();
}


function showStudentDashboard() {
    hideAllPages();
    show("studentDashboard");

    updateCounts();
    renderStudentDashboardHomeworks();
}


function showHomeworkSection() {
    hideAllPages();
    show("homeworkSection");

    if (currentUser.role === "teacher") {
        show("addHomeworkButton");
    } else {
        hide("addHomeworkButton");
    }

    renderHomeworks();
}


function showStudentHomeworkSection() {
    showHomeworkSection();
}


function showStudentsSection() {
    if (currentUser.role !== "teacher") {
        return;
    }

    hideAllPages();
    show("studentsSection");

    renderStudents();
}


function showTeachersSection() {
    if (currentUser.role !== "teacher") {
        return;
    }

    hideAllPages();
    show("teachersSection");

    renderTeachers();
}


function showAnnouncementsSection() {
    hideAllPages();
    show("announcementsSection");

    if (currentUser.role === "teacher") {
        show("addAnnouncementButton");
    } else {
        hide("addAnnouncementButton");
    }

    renderAnnouncements();
}


function showStudentAnnouncementSection() {
    showAnnouncementsSection();
}


// =========================================================
// MOBILE NAVIGATION
// =========================================================

function mobileGoHome() {
    if (currentUser.role === "teacher") {
        showTeacherDashboard();
    } else {
        showStudentDashboard();
    }
}


function mobileGoHomework() {
    showHomeworkSection();
}


function mobileGoAnnouncements() {
    showAnnouncementsSection();
}


// =========================================================
// COUNTS
// =========================================================

function updateCounts() {
    const homeworks = getArray("homeworks");
    const students = getArray("students");
    const announcements = getArray("announcements");

    setText("homeworkCount", homeworks.length);
    setText("studentCount", students.length);
    setText("announcementCount", announcements.length);

    setText("studentHomeworkCount", homeworks.length);
    setText(
        "studentAnnouncementCount",
        announcements.length
    );
}


// =========================================================
// HOMEWORK MODAL
// =========================================================

function openHomeworkModal() {
    if (currentUser.role !== "teacher") {
        return;
    }

    show("homeworkModal");
}


function closeHomeworkModal() {
    hide("homeworkModal");
}


function saveHomework() {
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
        alert("⚠️ Barcha joylarni to‘ldiring.");
        return;
    }

    const homeworks = getArray("homeworks");

    homeworks.push({
        subject,
        text,
        date,
        createdBy: currentUser.name
    });

    saveArray("homeworks", homeworks);

    document.getElementById("subject").value = "";
    document.getElementById("homeworkText").value = "";
    document.getElementById("homeworkDate").value = "";

    closeHomeworkModal();

    renderHomeworks();
    renderDashboardHomeworks();
    renderStudentDashboardHomeworks();

    updateCounts();
}


function deleteHomework(index) {
    if (currentUser.role !== "teacher") {
        return;
    }

    const homeworks = getArray("homeworks");

    homeworks.splice(index, 1);

    saveArray("homeworks", homeworks);

    renderHomeworks();
    renderDashboardHomeworks();

    updateCounts();
}


// =========================================================
// HOMEWORK RENDER
// =========================================================

function createHomeworkCard(homework, index, canDelete) {
    const card = document.createElement("article");

    card.className = "item-card";

    const content = document.createElement("div");

    content.className = "item-card-content";

    const title = document.createElement("h3");

    title.textContent = "📖 " + homework.subject;

    const text = document.createElement("p");

    text.textContent = homework.text;

    const date = document.createElement("p");

    date.className = "item-date";

    date.textContent =
        "📅 Topshirish sanasi: " +
        homework.date;

    content.append(title, text, date);

    card.appendChild(content);

    if (canDelete) {
        const deleteButton =
            document.createElement("button");

        deleteButton.className = "delete-button";
        deleteButton.textContent = "🗑️";

        deleteButton.onclick = () =>
            deleteHomework(index);

        card.appendChild(deleteButton);
    }

    return card;
}


function renderHomeworks() {
    const container =
        document.getElementById(
            "modernHomeworkList"
        );

    if (!container) {
        return;
    }

    const homeworks = getArray("homeworks");

    container.innerHTML = "";

    if (homeworks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                📚 Hozircha uy vazifalari yo‘q.
            </div>
        `;

        return;
    }

    homeworks
        .slice()
        .reverse()
        .forEach((homework, reverseIndex) => {
            const originalIndex =
                homeworks.length - 1 - reverseIndex;

            container.appendChild(
                createHomeworkCard(
                    homework,
                    originalIndex,
                    currentUser.role === "teacher"
                )
            );
        });
}


function renderDashboardHomeworks() {
    const container =
        document.getElementById(
            "dashboardHomeworkList"
        );

    if (!container) {
        return;
    }

    const homeworks = getArray("homeworks");

    container.innerHTML = "";

    if (homeworks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                Hozircha vazifalar yo‘q.
            </div>
        `;

        return;
    }

    homeworks
        .slice(-3)
        .reverse()
        .forEach(homework => {
            container.appendChild(
                createHomeworkCard(
                    homework,
                    0,
                    false
                )
            );
        });
}


function renderStudentDashboardHomeworks() {
    const container =
        document.getElementById(
            "studentDashboardHomework"
        );

    if (!container) {
        return;
    }

    const homeworks = getArray("homeworks");

    container.innerHTML = "";

    if (homeworks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                Hozircha vazifalar yo‘q.
            </div>
        `;

        return;
    }

    homeworks
        .slice(-3)
        .reverse()
        .forEach(homework => {
            container.appendChild(
                createHomeworkCard(
                    homework,
                    0,
                    false
                )
            );
        });
}


// =========================================================
// STUDENTS
// =========================================================

function openStudentModal() {
    if (currentUser.role !== "teacher") {
        return;
    }

    show("studentModal");
}


function closeStudentModal() {
    hide("studentModal");
}


function saveStudent() {
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

    const students = getArray("students");

    const exists = students.some(
        student =>
            student.name.toLowerCase() ===
            name.toLowerCase()
    );

    if (exists) {
        alert("⚠️ Bu ismli o‘quvchi mavjud.");
        return;
    }

    students.push({
        name,
        password
    });

    saveArray("students", students);

    document.getElementById("studentName").value = "";
    document.getElementById("studentPassword").value = "";

    closeStudentModal();

    renderStudents();
    updateCounts();
}


function deleteStudent(index) {
    if (currentUser.role !== "teacher") {
        return;
    }

    const students = getArray("students");

    const deletedStudent = students[index];

    students.splice(index, 1);

    saveArray("students", students);

    if (deletedStudent) {
        const profiles = getProfiles();

        delete profiles[
            profileKey(deletedStudent.name)
        ];

        saveProfiles(profiles);
    }

    renderStudents();
    updateCounts();
}


function renderStudents() {
    const container =
        document.getElementById(
            "modernStudentList"
        );

    if (!container) {
        return;
    }

    const students = getArray("students");

    container.innerHTML = "";

    if (students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                👨‍🎓 Hozircha o‘quvchilar yo‘q.
            </div>
        `;

        return;
    }

    students.forEach((student, index) => {
        const card =
            document.createElement("div");

        card.className = "person-card";

        const avatar =
            createAvatar(
                student.name,
                "avatar avatar-medium"
            );

        const info =
            document.createElement("div");

        info.className = "person-info";

        const name =
            document.createElement("strong");

        name.textContent = student.name;

        const role =
            document.createElement("small");

        role.textContent = "O‘quvchi";

        info.append(name, role);

        const deleteButton =
            document.createElement("button");

        deleteButton.className = "delete-button";
        deleteButton.textContent = "🗑️";

        deleteButton.onclick = () =>
            deleteStudent(index);

        card.append(
            avatar,
            info,
            deleteButton
        );

        container.appendChild(card);
    });
}


// =========================================================
// TEACHERS
// =========================================================

function openTeacherModal() {
    if (currentUser.role !== "teacher") {
        return;
    }

    show("teacherModal");
}


function closeTeacherModal() {
    hide("teacherModal");
}


function saveTeacher() {
    if (currentUser.role !== "teacher") {
        return;
    }

    const name = document
        .getElementById("teacherName")
        .value
        .trim();

    const password = document
        .getElementById("teacherNewPassword")
        .value;

    if (!name || !password) {
        alert("⚠️ Ism va parolni kiriting.");
        return;
    }

    const teachers = getArray("teachers");

    const exists =
        teachers.some(
            teacher =>
                teacher.name.toLowerCase() ===
                name.toLowerCase()
        ) ||
        name.toLowerCase() ===
        MAIN_TEACHER.name.toLowerCase();

    if (exists) {
        alert("⚠️ Bu ismli o‘qituvchi mavjud.");
        return;
    }

    teachers.push({
        name,
        password
    });

    saveArray("teachers", teachers);

    document.getElementById("teacherName").value = "";
    document.getElementById("teacherNewPassword").value = "";

    closeTeacherModal();

    renderTeachers();
}


function deleteTeacher(index) {
    if (currentUser.role !== "teacher") {
        return;
    }

    const teachers = getArray("teachers");

    teachers.splice(index, 1);

    saveArray("teachers", teachers);

    renderTeachers();
}


function renderTeachers() {
    const container =
        document.getElementById(
            "modernTeacherList"
        );

    if (!container) {
        return;
    }

    const teachers = getArray("teachers");

    container.innerHTML = "";

    createTeacherPersonCard(
        container,
        MAIN_TEACHER.name,
        "Asosiy o‘qituvchi",
        null
    );

    teachers.forEach((teacher, index) => {
        createTeacherPersonCard(
            container,
            teacher.name,
            "O‘qituvchi",
            index
        );
    });
}


function createTeacherPersonCard(
    container,
    name,
    role,
    deleteIndex
) {
    const card =
        document.createElement("div");

    card.className = "person-card";

    const avatar =
        createAvatar(
            name,
            "avatar avatar-medium"
        );

    const info =
        document.createElement("div");

    info.className = "person-info";

    const title =
        document.createElement("strong");

    title.textContent = name;

    const subtitle =
        document.createElement("small");

    subtitle.textContent = role;

    info.append(title, subtitle);

    card.append(avatar, info);

    if (deleteIndex !== null) {
        const button =
            document.createElement("button");

        button.className = "delete-button";
        button.textContent = "🗑️";

        button.onclick = () =>
            deleteTeacher(deleteIndex);

        card.appendChild(button);
    }

    container.appendChild(card);
}


// =========================================================
// ANNOUNCEMENTS
// =========================================================

function openAnnouncementModal() {
    if (currentUser.role !== "teacher") {
        return;
    }

    show("announcementModal");
}


function closeAnnouncementModal() {
    hide("announcementModal");
}


function saveAnnouncement() {
    if (currentUser.role !== "teacher") {
        return;
    }

    const title = document
        .getElementById("announcementTitle")
        .value
        .trim();

    const text = document
        .getElementById("announcementText")
        .value
        .trim();

    const date = document
        .getElementById("announcementDate")
        .value;

    if (!title || !text || !date) {
        alert("⚠️ Barcha joylarni to‘ldiring.");
        return;
    }

    const announcements =
        getArray("announcements");

    announcements.push({
        title,
        text,
        date,
        createdBy: currentUser.name
    });

    saveArray(
        "announcements",
        announcements
    );

    document.getElementById(
        "announcementTitle"
    ).value = "";

    document.getElementById(
        "announcementText"
    ).value = "";

    document.getElementById(
        "announcementDate"
    ).value = "";

    closeAnnouncementModal();

    renderAnnouncements();
    updateCounts();
}


function deleteAnnouncement(index) {
    if (currentUser.role !== "teacher") {
        return;
    }

    const announcements =
        getArray("announcements");

    announcements.splice(index, 1);

    saveArray(
        "announcements",
        announcements
    );

    renderAnnouncements();
    updateCounts();
}


function renderAnnouncements() {
    const container =
        document.getElementById(
            "modernAnnouncementList"
        );

    if (!container) {
        return;
    }

    const announcements =
        getArray("announcements");

    container.innerHTML = "";

    if (announcements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                📢 Hozircha e’lonlar yo‘q.
            </div>
        `;

        return;
    }

    announcements
        .slice()
        .reverse()
        .forEach((announcement, reverseIndex) => {
            const originalIndex =
                announcements.length -
                1 -
                reverseIndex;

            const card =
                document.createElement("article");

            card.className = "item-card";

            const content =
                document.createElement("div");

            content.className =
                "item-card-content";

            const title =
                document.createElement("h3");

            title.textContent =
                "📢 " + announcement.title;

            const text =
                document.createElement("p");

            text.textContent =
                announcement.text;

            const date =
                document.createElement("p");

            date.className = "item-date";

            date.textContent =
                "📅 " + announcement.date;

            content.append(
                title,
                text,
                date
            );

            card.appendChild(content);

            if (currentUser.role === "teacher") {
                const button =
                    document.createElement("button");

                button.className =
                    "delete-button";

                button.textContent = "🗑️";

                button.onclick = () =>
                    deleteAnnouncement(
                        originalIndex
                    );

                card.appendChild(button);
            }

            container.appendChild(card);
        });
}


// =========================================================
// PROFILE
// =========================================================

function openProfile() {
    if (!currentUser.name) {
        return;
    }

    pendingProfilePhoto = null;

    setText("profileName", currentUser.name);

    setText(
        "profileRole",
        currentUser.role === "teacher"
            ? "O‘qituvchi"
            : "O‘quvchi"
    );

    renderAvatar(
        document.getElementById(
            "profileAvatar"
        ),
        currentUser.name
    );

    const input =
        document.getElementById(
            "profilePhotoInput"
        );

    input.value = "";

    show("profileModal");
}


function closeProfile() {
    pendingProfilePhoto = null;

    hide("profileModal");
}


function previewProfilePhoto(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("⚠️ Rasm faylini tanlang.");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ Rasm 5 MB dan kichik bo‘lsin.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (readerEvent) {
        const image = new Image();

        image.onload = function () {
            pendingProfilePhoto =
                makeSquareProfileImage(image);

            showProfilePreview(
                pendingProfilePhoto
            );
        };

        image.src = readerEvent.target.result;
    };

    reader.readAsDataURL(file);
}


function makeSquareProfileImage(image) {
    const canvas =
        document.createElement("canvas");

    const size = 320;

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    const sourceSize =
        Math.min(image.width, image.height);

    const sourceX =
        (image.width - sourceSize) / 2;

    const sourceY =
        (image.height - sourceSize) / 2;

    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
    );

    return canvas.toDataURL(
        "image/jpeg",
        0.78
    );
}


function showProfilePreview(photo) {
    const avatar =
        document.getElementById(
            "profileAvatar"
        );

    avatar.innerHTML = "";

    const image =
        document.createElement("img");

    image.src = photo;
    image.alt = "";

    avatar.appendChild(image);
}


function saveProfilePhoto() {
    if (!pendingProfilePhoto) {
        alert("⚠️ Avval rasm tanlang.");
        return;
    }

    const profiles = getProfiles();

    profiles[profileKey(currentUser.name)] = {
        photo: pendingProfilePhoto
    };

    try {
        saveProfiles(profiles);
    } catch {
        alert(
            "❌ Brauzer xotirasi yetmadi. Kichikroq rasm tanlang."
        );

        return;
    }

    pendingProfilePhoto = null;

    updateUserUI();

    renderAvatar(
        document.getElementById(
            "profileAvatar"
        ),
        currentUser.name
    );

    refreshVisiblePeople();

    if (currentChatMode === "public") {
        renderPublicMessages();
    } else {
        renderPrivateMessages();
    }

    alert("✅ Profil rasmi saqlandi.");
}


function removeProfilePhoto() {
    const profiles = getProfiles();

    delete profiles[
        profileKey(currentUser.name)
    ];

    saveProfiles(profiles);

    pendingProfilePhoto = null;

    renderAvatar(
        document.getElementById(
            "profileAvatar"
        ),
        currentUser.name
    );

    updateUserUI();
    refreshVisiblePeople();

    if (currentChatMode === "public") {
        renderPublicMessages();
    } else {
        renderPrivateMessages();
    }
}


function refreshVisiblePeople() {
    if (currentUser.role === "teacher") {
        renderStudents();
        renderTeachers();
    }
}


// =========================================================
// CHAT OPEN / CLOSE
// =========================================================

function openChat() {
    if (!currentUser.name) {
        return;
    }

    currentChatMode = "public";
    selectedPrivateUser = "";

    show("chatWorkspace");

    document
        .querySelector(".chat-sidebar")
        ?.classList.remove("mobile-hidden");

    hide("privateUserBar");
    hide("privateMessages");

    show("publicMessages");

    setPublicHeader();

    loadChatUsers();
    buildEmojiPicker();
    renderPublicMessages();

    document.getElementById(
        "messageInput"
    ).placeholder = "Xabar yozing...";
}


function closeChat() {
    hide("chatWorkspace");
    hide("emojiPicker");
}


function showChatSidebar() {
    const sidebar =
        document.querySelector(
            ".chat-sidebar"
        );

    if (!sidebar) {
        return;
    }

    sidebar.classList.remove(
        "mobile-hidden"
    );
}


function hideChatSidebarOnMobile() {
    if (window.innerWidth <= 760) {
        document
            .querySelector(".chat-sidebar")
            ?.classList.add("mobile-hidden");
    }
}


// =========================================================
// PUBLIC CHAT
// =========================================================

function openPublicChat() {
    currentChatMode = "public";
    selectedPrivateUser = "";

    hide("privateUserBar");
    hide("privateMessages");

    show("publicMessages");

    setPublicHeader();

    hideChatSidebarOnMobile();

    renderPublicMessages();

    setTimeout(() => {
        focusChatInput();
    }, 100);
}


function setPublicHeader() {
    setText(
        "conversationTitle",
        "Ommaviy chat"
    );

    setText(
        "conversationSubtitle",
        "Barcha sinf a’zolari"
    );

    const avatar =
        document.getElementById(
            "conversationAvatar"
        );

    avatar.className =
        "avatar avatar-medium public-avatar";

    avatar.innerHTML = "🌐";
}


// =========================================================
// PUBLIC MESSAGES
// =========================================================

function renderPublicMessages() {
    const container =
        document.getElementById(
            "publicMessages"
        );

    const messages =
        getArray("publicMessages");

    container.innerHTML = "";

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                Hozircha xabarlar yo‘q 👋
            </div>
        `;

        return;
    }

    messages.forEach(message => {
        container.appendChild(
            createMessageRow({
                sender: message.sender,
                text: message.text,
                date: message.date,
                mine:
                    message.sender ===
                    currentUser.name
            })
        );
    });

    scrollMessagesToBottom(container);
}


function sendPublicMessage(text) {
    const messages =
        getArray("publicMessages");

    messages.push({
        sender: currentUser.name,
        role: currentUser.role,
        text,
        date: getMessageTime()
    });

    saveArray(
        "publicMessages",
        messages
    );

    renderPublicMessages();
}


// =========================================================
// PRIVATE CHAT
// =========================================================

function openPrivateChatList() {
    currentChatMode = "private";

    hide("publicMessages");

    show("privateMessages");
    show("privateUserBar");

    loadChatUsers();

    setText(
        "conversationTitle",
        "Individual chat"
    );

    setText(
        "conversationSubtitle",
        "Suhbatdoshni tanlang"
    );

    const avatar =
        document.getElementById(
            "conversationAvatar"
        );

    avatar.className =
        "avatar avatar-medium private-avatar";

    avatar.innerHTML = "👤";

    hideChatSidebarOnMobile();

    renderPrivateMessages();
}


function loadChatUsers() {
    const select =
        document.getElementById(
            "chatUserSelect"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Suhbatdoshni tanlang
        </option>
    `;

    const users = [];

    users.push({
        name: MAIN_TEACHER.name,
        role: "teacher"
    });

    getArray("teachers").forEach(
        teacher => {
            users.push({
                name: teacher.name,
                role: "teacher"
            });
        }
    );

    getArray("students").forEach(
        student => {
            users.push({
                name: student.name,
                role: "student"
            });
        }
    );

    users.forEach(user => {
        if (
            user.name.toLowerCase() ===
            currentUser.name.toLowerCase()
        ) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = user.name;

        option.textContent =
            user.role === "teacher"
                ? "👨‍🏫 " + user.name
                : "👨‍🎓 " + user.name;

        select.appendChild(option);
    });

    if (selectedPrivateUser) {
        select.value =
            selectedPrivateUser;
    }
}


function selectPrivateConversation() {
    const select =
        document.getElementById(
            "chatUserSelect"
        );

    selectedPrivateUser =
        select.value;

    if (!selectedPrivateUser) {
        setText(
            "conversationTitle",
            "Individual chat"
        );

        setText(
            "conversationSubtitle",
            "Suhbatdoshni tanlang"
        );

        const avatar =
            document.getElementById(
                "conversationAvatar"
            );

        avatar.className =
            "avatar avatar-medium private-avatar";

        avatar.innerHTML = "👤";

        renderPrivateMessages();

        return;
    }

    setText(
        "conversationTitle",
        selectedPrivateUser
    );

    setText(
        "conversationSubtitle",
        "Shaxsiy suhbat"
    );

    const avatar =
        document.getElementById(
            "conversationAvatar"
        );

    avatar.className =
        "avatar avatar-medium";

    renderAvatar(
        avatar,
        selectedPrivateUser
    );

    renderPrivateMessages();

    focusChatInput();
}


function renderPrivateMessages() {
    const container =
        document.getElementById(
            "privateMessages"
        );

    container.innerHTML = "";

    if (!selectedPrivateUser) {
        container.innerHTML = `
            <div class="chat-empty">
                👤 Suhbatdoshni tanlang.
            </div>
        `;

        return;
    }

    const messages =
        getArray("privateMessages");

    const conversation =
        messages.filter(message =>
            (
                message.from === currentUser.name &&
                message.to === selectedPrivateUser
            )
            ||
            (
                message.from === selectedPrivateUser &&
                message.to === currentUser.name
            )
        );

    if (conversation.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                Bu suhbatda hali xabar yo‘q 👋
            </div>
        `;

        return;
    }

    conversation.forEach(message => {
        const mine =
            message.from === currentUser.name;

        container.appendChild(
            createMessageRow({
                sender: mine
                    ? currentUser.name
                    : message.from,

                text: message.text,

                date: message.date,

                mine
            })
        );
    });

    scrollMessagesToBottom(container);
}


function sendPrivateMessage(text) {
    if (!selectedPrivateUser) {
        alert(
            "⚠️ Avval suhbatdoshni tanlang."
        );

        return;
    }

    const messages =
        getArray("privateMessages");

    messages.push({
        from: currentUser.name,
        to: selectedPrivateUser,
        text,
        date: getMessageTime()
    });

    saveArray(
        "privateMessages",
        messages
    );

    renderPrivateMessages();
}


// =========================================================
// CREATE TELEGRAM-STYLE MESSAGE
// =========================================================

function createMessageRow({
    sender,
    text,
    date,
    mine
}) {
    const row =
        document.createElement("div");

    row.className =
        mine
            ? "message-row mine"
            : "message-row other";


    // Avatar faqat boshqa odam xabarida
    if (!mine) {
        const avatar =
            createAvatar(
                sender,
                "message-avatar"
            );

        row.appendChild(avatar);
    }


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";


    if (!mine) {
        const senderElement =
            document.createElement("div");

        senderElement.className =
            "message-sender";

        senderElement.textContent =
            sender;

        bubble.appendChild(
            senderElement
        );
    }


    const textElement =
        document.createElement("div");

    textElement.className =
        "message-text";

    textElement.textContent =
        text;


    const timeElement =
        document.createElement("div");

    timeElement.className =
        "message-time";

    timeElement.textContent =
        date;


    bubble.append(
        textElement,
        timeElement
    );

    row.appendChild(bubble);

    return row;
}


// =========================================================
// SEND CURRENT MESSAGE
// =========================================================

function sendCurrentMessage() {
    const input =
        document.getElementById(
            "messageInput"
        );

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    if (currentChatMode === "public") {
        sendPublicMessage(text);
    } else {
        if (!selectedPrivateUser) {
            alert(
                "⚠️ Avval suhbatdoshni tanlang."
            );

            return;
        }

        sendPrivateMessage(text);
    }

    input.value = "";

    hide("emojiPicker");

    setTimeout(() => {
        focusChatInput();
    }, 30);
}


function handleChatEnter(event) {
    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {
        event.preventDefault();

        sendCurrentMessage();
    }
}


function focusChatInput() {
    const input =
        document.getElementById(
            "messageInput"
        );

    if (input) {
        input.focus();
    }
}


// =========================================================
// MESSAGE TIME
// =========================================================

function getMessageTime() {
    return new Date().toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// =========================================================
// SCROLL
// =========================================================

function scrollMessagesToBottom(
    container
) {
    if (!container) {
        return;
    }

    requestAnimationFrame(() => {
        container.scrollTop =
            container.scrollHeight;
    });
}


// =========================================================
// EMOJI
// =========================================================

const EMOJIS = [
    "😀", "😃", "😄", "😁", "😂", "🤣",
    "😊", "😍", "🥰", "😎", "🤔", "😅",
    "😭", "😮", "😴", "🤩", "🥳", "😇",
    "👍", "👎", "👏", "🙌", "🙏", "💪",
    "❤️", "💙", "💚", "💜", "🔥", "✨",
    "🎉", "🎯", "💯", "⭐", "📚", "✍️"
];


function buildEmojiPicker() {
    const picker =
        document.getElementById(
            "emojiPicker"
        );

    if (
        !picker ||
        picker.dataset.ready === "true"
    ) {
        return;
    }

    picker.innerHTML = "";

    EMOJIS.forEach(emoji => {
        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = emoji;

        button.onclick = () =>
            insertEmoji(emoji);

        picker.appendChild(button);
    });

    picker.dataset.ready = "true";
}


function toggleEmojiPicker() {
    buildEmojiPicker();

    const picker =
        document.getElementById(
            "emojiPicker"
        );

    picker.classList.toggle("hidden");
}


function insertEmoji(emoji) {
    const input =
        document.getElementById(
            "messageInput"
        );

    const start =
        input.selectionStart ??
        input.value.length;

    const end =
        input.selectionEnd ??
        input.value.length;

    input.value =
        input.value.slice(0, start) +
        emoji +
        input.value.slice(end);

    const newPosition =
        start + emoji.length;

    input.setSelectionRange(
        newPosition,
        newPosition
    );

    input.focus();
}


// =========================================================
// MOBILE KEYBOARD SUPPORT
// =========================================================

function setupMobileKeyboard() {
    if (!window.visualViewport) {
        return;
    }

    const workspace =
        document.getElementById(
            "chatWorkspace"
        );

    function updateChatHeight() {
        if (
            !workspace ||
            workspace.classList.contains(
                "hidden"
            )
        ) {
            return;
        }

        workspace.style.height =
            window.visualViewport.height +
            "px";

        workspace.style.top =
            window.visualViewport.offsetTop +
            "px";

        workspace.style.bottom =
            "auto";
    }

    window.visualViewport.addEventListener(
        "resize",
        updateChatHeight
    );

    window.visualViewport.addEventListener(
        "scroll",
        updateChatHeight
    );
}


// =========================================================
// CLOSE MODALS BY CLICKING BACKGROUND
// =========================================================

document.addEventListener(
    "click",
    function (event) {
        if (
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {
            event.target.classList.add(
                "hidden"
            );
        }
    }
);


// =========================================================
// ESC KEY
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {
        if (event.key !== "Escape") {
            return;
        }

        [
            "profileModal",
            "homeworkModal",
            "studentModal",
            "teacherModal",
            "announcementModal",
            "emojiPicker"
        ].forEach(hide);
    }
);


// =========================================================
// START
// =========================================================

function startApp() {
    buildEmojiPicker();
    setupMobileKeyboard();

    renderHomeworks();
    renderStudents();
    renderTeachers();
    renderAnnouncements();

    updateCounts();
}


startApp();