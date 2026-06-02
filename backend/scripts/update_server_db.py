import sqlite3
import os
import json
import uuid
import datetime

db_path = "/home/ubuntu/highlawmain/backend/data/db/highlaw.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Clear existing lawyers
try:
    cursor.execute("DELETE FROM lawyers")
    print("Cleared existing lawyers in DB on server.")
except Exception as e:
    print("Error clearing lawyers table:", e)

# Data for new lawyers
lawyers_data = [
    {
        "id": str(uuid.uuid4()),
        "name": "강민구",
        "name_en": "MinGu Kang",
        "position": "대표변호사",
        "photo_url": "/lawyers/kangmingu.jpg",
        "education": json.dumps([
            {"period": "", "title": "고려대학교 법학전문대학원 졸업"},
            {"period": "", "title": "고려대학교 사회학과, 정치외교학과 졸업"},
            {"period": "", "title": "휘문고등학교 졸업"}
        ], ensure_ascii=False),
        "career": json.dumps([
            {"period": "前", "title": "법무법인 와이케이 노동중대재해형사부 우수변호사"},
            {"period": "前", "title": "방위사업청 소송수행자"},
            {"period": "前", "title": "해군 군검사"},
            {"period": "前", "title": "소말리아해역호송전대(청해부대) 법무참모"},
            {"period": "前", "title": "해병대사령부 법무관"},
            {"period": "前", "title": "해군 작전사령부 법무관"},
            {"period": "前", "title": "로펌 프로보노 인턴"},
            {"period": "前", "title": "대한상사중재원 실무수습"},
            {"period": "前", "title": "검찰 실무수습"},
            {"period": "前", "title": "Korea University Law Review 편집장"}
        ], ensure_ascii=False),
        "specialties": json.dumps(["노동", "인사", "중대재해", "기업"], ensure_ascii=False),
        "introduction": "고려대학교 법학전문대학원을 졸업하고 해군 군검사, 방위사업청 소송수행자, 청해부대 법무참모 등 공직에서의 깊이 있는 법무 경험과 대형 로펌(법무법인 와이케이) 노동중대재해형사부에서의 우수한 실무 경험을 바탕으로, 노동·인사·중대재해 및 기업 분야의 법률 리스크를 정확하고 명쾌하게 해결합니다.",
        "tagline": "노동, 인사, 중대재해, 기업 법률 리스크의 확실한 해결사",
        "email": "kangmingu@highlaw.co.kr",
        "phone": "02-594-5583",
        "consult_hours": "평일 09:30 – 18:00",
        "sort_order": 1,
        "is_active": 1
    },
    {
        "id": str(uuid.uuid4()),
        "name": "김범",
        "name_en": "Beom Kim",
        "position": "대표변호사",
        "photo_url": "/lawyers/kimbeom.jpg",
        "education": json.dumps([
            {"period": "", "title": "전남대학교 법학전문대학원 졸업"},
            {"period": "", "title": "동국대학교 정치외교 · 경제학 졸업"},
            {"period": "", "title": "전민고등학교 졸업"}
        ], ensure_ascii=False),
        "career": json.dumps([
            {"period": "前", "title": "법무법인(유) 로고스 변호사"},
            {"period": "前", "title": "국방부 차관실 소송수행자"},
            {"period": "前", "title": "육군 23사단 법무부 군검사 및 징계장교"}
        ], ensure_ascii=False),
        "specialties": json.dumps(["송무", "기업자문"], ensure_ascii=False),
        "introduction": "전남대학교 법학전문대학원을 졸업하고, 법무법인(유) 로고스 변호사, 국방부 차관실 소송수행자, 육군 23사단 군검사 및 징계장교 등 풍부한 공공 및 대형 로펌 송무 경험을 지닌 송무 및 기업자문 전문 변호사입니다.",
        "tagline": "성공적인 송무와 신뢰할 수 있는 기업 자문 파트너",
        "email": "kimbeom@highlaw.co.kr",
        "phone": "02-594-5583",
        "consult_hours": "평일 09:30 – 18:00",
        "sort_order": 2,
        "is_active": 1
    },
    {
        "id": str(uuid.uuid4()),
        "name": "조덕재",
        "name_en": "Deok Jae Cho",
        "position": "대표변호사",
        "photo_url": "/lawyers/jodeokjae.jpg",
        "education": json.dumps([
            {"period": "", "title": "영남대학교 법학전문대학원 졸업"},
            {"period": "", "title": "부산대학교 법학과 졸업"}
        ], ensure_ascii=False),
        "career": json.dumps([
            {"period": "前", "title": "법무법인 와이케이 변호사(중대재해노동형사부)"},
            {"period": "前", "title": "국방시설본부 소송수행자(부동산·건설 민·행정소송)"},
            {"period": "前", "title": "육군 15사단 법무부 군검사"},
            {"period": "前", "title": "육군 2군단 법무부 군검사 (지역검찰단 파견)"}
        ], ensure_ascii=False),
        "specialties": json.dumps(["노동", "중대재해", "형사"], ensure_ascii=False),
        "introduction": "영남대학교 법학전문대학원을 졸업하고, 법무법인 와이케이 중대재해노동형사부 변호사, 국방시설본부 소송수행자(부동산·건설 민·행정소송), 육군 군검사 등 대형 로펌 및 군 검사 출신으로서 노동, 중대재해 및 형사사건 전문 변호사입니다.",
        "tagline": "노동, 중대재해, 형사 분야의 압도적인 전문성과 검증된 실력",
        "email": "jodeokjae@highlaw.co.kr",
        "phone": "02-594-5583",
        "consult_hours": "평일 09:30 – 18:00",
        "sort_order": 3,
        "is_active": 1
    }
]

# Insert new lawyers
for l in lawyers_data:
    try:
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO lawyers (
                id, name, name_en, position, photo_url, education, career, 
                specialties, introduction, tagline, email, phone, consult_hours, 
                sort_order, is_active, created_at, updated_at, qualifications, 
                publications, books, media, columns, cases, memberships
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]', '[]', '[]')
        """, (
            l["id"], l["name"], l["name_en"], l["position"], l["photo_url"],
            l["education"], l["career"], l["specialties"], l["introduction"],
            l["tagline"], l["email"], l["phone"], l["consult_hours"],
            l["sort_order"], l["is_active"], now_str, now_str
        ))
        print(f"Successfully inserted {l['name']}")
    except Exception as e:
        print(f"Error inserting {l['name']}: {e}")

conn.commit()
conn.close()
print("Remote DB successfully updated!")
