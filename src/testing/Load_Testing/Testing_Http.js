import http from "k6/http";
import { sleep } from "k6";

export let options = {
    stages: [
        { duration: "2m", target: 100 },
        { duration: "2m", target: 1000 },
        { duration: "2m", target: 0 },
    ]

};


const headersStudent = {
    "Content-Type": "application/json",
    Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2wiOiJzdHVkZW50IiwidXNlcklkIjoiNjkzOWYxMjA2YzM2MmYwOTdjNmUyMjgwIiwiZW1haWwiOiJodXNzaWVuYW1nYWQxMjNAZ21haWwuY29tIiwibmFtZSI6Ikh1c3NpZW4gQWJvb3VmIiwicGhvbmUiOiIwMTIwMTY3MDIzOSIsImlhdCI6MTc2Nzc3NTczNCwiZXhwIjoxNzY3Nzc5MzM0fQ.68bQ3HoQFnhw_FWzfIMHcIWSpKgbAIMuAR8eNiO-bbQ",
};

function checkResponse(res, endpoint) {
    if (res.status !== 200) {
        console.log(`❌ Failed request: ${endpoint}`);
        console.log(`   Status: ${res.status}`);
        console.log(`   Body: ${res.body}`);
    } else {
        console.log(`✅ Success: ${endpoint}`);
    }
}

export default function () {
    let res;

    res = http.get("http://localhost:5000/student/exam/1/3/1767344892898", { headers: headersStudent });
    checkResponse(res, "/student/student/exam");

    res = http.get("http://localhost:5000/student/profile", { headers: headersStudent });
    checkResponse(res, "/student/profile");

    res = http.post(
        "http://localhost:5000/student/get_views",
        JSON.stringify({
            userId: "6939f1206c362f097c6e2280",
            courseId: 1,
            sectionId: 3,
            sectionableId: 1,
        }),
        { headers: { "Content-Type": "application/json" } }
    );
    checkResponse(res, "/student/get_views");

    res = http.post(
        "http://localhost:5000/student/transactions",
        JSON.stringify({
            token: headersStudent.Authorization.split(" ")[1],
        }),
        { headers: { "Content-Type": "application/json" } }
    );
    checkResponse(res, "/student/transactions");

    res = http.post(
        "http://localhost:5000/student/loginemail",
        JSON.stringify({ email: "hussienamgad123@gmail.com", password: "Hussien@27071977#" }),
        { headers: { "Content-Type": "application/json" } }
    );
    checkResponse(res, "/student/loginemail");

    res = http.post(
        "http://localhost:5000/student/loginphone",
        JSON.stringify({ phone: "01201670239", password: "Hussien@27071977#" }),
        { headers: { "Content-Type": "application/json" } }
    );
    checkResponse(res, "/student/loginphone");

    res = http.get("http://localhost:5000/course/get_course/1", { headers: { "Content-Type": "application/json" } });
    checkResponse(res, "/course/get_course");

    res = http.get("http://localhost:5000/course/get_all_courses", { headers: { "Content-Type": "application/json" } });
    checkResponse(res, "/course/get_all_courses");

    res = http.get("http://localhost:5000/course/courses/1", { headers: { "Content-Type": "application/json" } });
    checkResponse(res, "/course/courses");

    res = http.post(
        "http://localhost:5000/auth/check-access-course",
        JSON.stringify({ token: headersStudent.Authorization.split(" ")[1], courseId: 1 }),
        { headers: { "Content-Type": "application/json" } }
    );
    checkResponse(res, "/auth/check-access-course");

    res = http.post(
        "http://localhost:5000/auth/verify-token",
        JSON.stringify({ token: headersStudent.Authorization.split(" ")[1] }),
        { headers: { "Content-Type": "application/json" } }
    );
    checkResponse(res, "/auth/verify-token");

    res = http.get("http://localhost:5000/checkout", { headers: { "Content-Type": "application/json" } });
    checkResponse(res, "/checkout");

    sleep(1);
}
