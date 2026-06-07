/**
 * SQLite 스키마 초기화 — CREATE TABLE/INDEX/ALTER TABLE 정의
 *
 * 모든 raw SQL 문장이 여기 모여 있다. 초기 스키마 생성 + 멱등 ALTER 마이그레이션 +
 * 일부 데이터 백필 작업도 포함한다 (예: 강의 자동 분류, unsubscribe_token 백필).
 *
 * 주의: db/schema.js (Drizzle 스키마)와 동기화해야 한다.
 *       테이블 구조 변경 시 두 파일 모두 업데이트할 것.
 */
module.exports = {
  initTables(sqlite) {
  function warnMigrationSkip(err) {
    const message = err?.message || "";
    if (
      /duplicate column name/i.test(message) ||
      /already exists/i.test(message)
    ) {
      return;
    }
    console.warn("[db] schema migration statement skipped:", message);
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      document_type TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      author TEXT,
      source TEXT,
      published_date TEXT,
      content_markdown TEXT,
      content_html TEXT,
      content_plain TEXT,
      summary TEXT,
      status TEXT NOT NULL DEFAULT 'unread',
      importance INTEGER NOT NULL DEFAULT 3,
      file_path TEXT,
      file_type TEXT,
      file_size INTEGER,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parent_id TEXT,
      color TEXT,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS document_categories (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (document_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS document_collections (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (document_id, collection_id)
    );

    CREATE TABLE IF NOT EXISTS document_relations (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      position_start INTEGER NOT NULL,
      position_end INTEGER NOT NULL,
      highlight_text TEXT NOT NULL,
      note TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hero_videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'manhattan',
      is_active INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lawyers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT,
      position TEXT NOT NULL DEFAULT '변호사',
      photo_url TEXT,
      education TEXT,
      career TEXT,
      specialties TEXT,
      introduction TEXT,
      email TEXT,
      phone TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );


    CREATE TABLE IF NOT EXISTS lectures (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      venue TEXT,
      organizer TEXT,
      thumbnail_url TEXT,
      material_url TEXT,
      material_name TEXT,
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_lectures_lawyer_id ON lectures(lawyer_id);
    CREATE INDEX IF NOT EXISTS idx_lectures_is_published ON lectures(is_published);

    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
    CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
    CREATE INDEX IF NOT EXISTS idx_documents_importance ON documents(importance);
    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      attachment_urls TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
    CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'construction_realestate',
      excerpt TEXT,
      content TEXT NOT NULL,
      author TEXT,
      thumbnail_url TEXT,
      tags TEXT,
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image_url TEXT,
      geo_summary TEXT,
      geo_faq TEXT,
      geo_keywords TEXT,
      footnotes TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      scheduled_publish_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blog_post_versions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      version_no INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      category TEXT NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      author TEXT,
      thumbnail_url TEXT,
      tags TEXT,
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image_url TEXT,
      geo_summary TEXT,
      geo_faq TEXT,
      geo_keywords TEXT,
      footnotes TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      scheduled_publish_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS blog_view_events (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      event_key TEXT NOT NULL UNIQUE,
      referrer TEXT,
      user_agent TEXT,
      ip_masked TEXT,
      ip_hash TEXT,
      session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS case_results (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'civil',
      result TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
    CREATE INDEX IF NOT EXISTS idx_blog_post_versions_post_id ON blog_post_versions(post_id, version_no);
    CREATE INDEX IF NOT EXISTS idx_blog_view_events_post_id ON blog_view_events(post_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_blog_view_events_slug ON blog_view_events(slug, created_at);
    CREATE INDEX IF NOT EXISTS idx_blog_view_events_created_at ON blog_view_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_case_results_category ON case_results(category);
    CREATE INDEX IF NOT EXISTS idx_case_results_is_published ON case_results(is_published);

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      category TEXT,
      memo TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      consultation_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
    CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'sms',
      subject TEXT,
      content TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message_logs (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      recipient_name TEXT,
      recipient_contact TEXT NOT NULL,
      consultation_id TEXT,
      template_id TEXT,
      subject TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_message_logs_channel ON message_logs(channel);
    CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
    CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at);

    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      recipients TEXT NOT NULL,
      template_id TEXT,
      subject TEXT,
      content TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT NOT NULL DEFAULT 'manual',
      origin_ref TEXT,
      error_message TEXT,
      result TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status_scheduled ON scheduled_messages(status, scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_scheduled_messages_origin_ref ON scheduled_messages(origin_ref);

    CREATE TABLE IF NOT EXISTS auto_triggers (
      id TEXT PRIMARY KEY,
      trigger_type TEXT NOT NULL,
      name TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'sms',
      template_id TEXT,
      subject TEXT,
      content TEXT NOT NULL,
      delay_minutes INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_auto_triggers_type_enabled ON auto_triggers(trigger_type, is_enabled);

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      page TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_page_section ON site_settings(page, section);

    CREATE TABLE IF NOT EXISTS site_settings_history (
      id TEXT PRIMARY KEY,
      page TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT NOT NULL,
      previous_content TEXT,
      changed_by TEXT DEFAULT 'admin',
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_site_settings_history_page_section ON site_settings_history(page, section);
    CREATE INDEX IF NOT EXISTS idx_site_settings_history_changed_at ON site_settings_history(changed_at);

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'banner',
      title TEXT NOT NULL,
      content TEXT,
      link_url TEXT,
      bg_color TEXT DEFAULT '#b08d57',
      text_color TEXT DEFAULT '#ffffff',
      is_active INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      position TEXT DEFAULT 'top',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
    CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);

    CREATE TABLE IF NOT EXISTS scheduled_changes (
      id TEXT PRIMARY KEY,
      page TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_by TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_scheduled_changes_status ON scheduled_changes(status, scheduled_at);

    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      alt TEXT,
      folder TEXT DEFAULT 'general',
      uploaded_by TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files(folder);

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

    CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      page TEXT,
      path TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      ip TEXT,
      session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
    CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);

    CREATE TABLE IF NOT EXISTS portal_users (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      role TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_users_email ON portal_users(email);

    CREATE TABLE IF NOT EXISTS portal_posts (
      id TEXT PRIMARY KEY,
      portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'free',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_important INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_portal_posts_user_category ON portal_posts(portal_user_id, category);

    CREATE TABLE IF NOT EXISTS portal_events (
      id TEXT PRIMARY KEY,
      portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      is_all_day INTEGER NOT NULL DEFAULT 0,
      color TEXT DEFAULT '#6366f1',
      attendee_ids TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_portal_events_user_starts ON portal_events(portal_user_id, starts_at);
  `);

  // 기존 admin_users에 totp_secret 컬럼 추가 (이미 있으면 무시)
  try { sqlite.exec("ALTER TABLE admin_users ADD COLUMN totp_secret TEXT"); } catch (e) { warnMigrationSkip(e); }
  // 비밀번호 재설정 토큰 컬럼 — 토큰 기반 reset-link 방식. SHA-256 해시 + 만료 epoch ms.
  try { sqlite.exec("ALTER TABLE admin_users ADD COLUMN reset_token_hash TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE admin_users ADD COLUMN reset_token_expires_at INTEGER"); } catch (e) { warnMigrationSkip(e); }

  // documents — TipTap/HTML 기반 에디터 본문 보존
  try { sqlite.exec("ALTER TABLE documents ADD COLUMN content_html TEXT"); } catch (e) { warnMigrationSkip(e); }

  // clients 테이블에 태그/마지막 연락 시각 컬럼 추가 (이미 있으면 무시)
  try { sqlite.exec("ALTER TABLE clients ADD COLUMN tags TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE clients ADD COLUMN last_contacted_at TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE INDEX IF NOT EXISTS idx_clients_last_contacted_at ON clients(last_contacted_at)"); } catch (e) { warnMigrationSkip(e); }
  // 수신동의 컬럼 — 기본 1(동의)
  try { sqlite.exec("ALTER TABLE clients ADD COLUMN sms_consent INTEGER NOT NULL DEFAULT 1"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE clients ADD COLUMN email_consent INTEGER NOT NULL DEFAULT 1"); } catch (e) { warnMigrationSkip(e); }
  // 공개 수신거부 토큰 — 기존 행은 NULL, 최초 수신거부 페이지 접근 전에 lazy 생성되거나 관리 UI에서 할당
  try { sqlite.exec("ALTER TABLE clients ADD COLUMN unsubscribe_token TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_unsubscribe_token ON clients(unsubscribe_token)"); } catch (e) { warnMigrationSkip(e); }

  // 고객별 법률 사건 (1:N) 및 관련자 (1:N) 테이블 — 2026-06-08
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS client_cases (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        case_number TEXT,
        jurisdiction TEXT,
        memo TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_client_cases_client_id ON client_cases(client_id);

      CREATE TABLE IF NOT EXISTS client_related_persons (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_client_related_persons_client_id ON client_related_persons(client_id);
    `);
  } catch (e) { warnMigrationSkip(e); }
  // 이메일 열람 추적 컬럼 (이미 있으면 무시)
  try { sqlite.exec("ALTER TABLE message_logs ADD COLUMN opened_at TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE message_logs ADD COLUMN open_count INTEGER NOT NULL DEFAULT 0"); } catch (e) { warnMigrationSkip(e); }
  // auto_triggers에 재참여용 threshold_days 컬럼 추가
  try { sqlite.exec("ALTER TABLE auto_triggers ADD COLUMN threshold_days INTEGER NOT NULL DEFAULT 90"); } catch (e) { warnMigrationSkip(e); }

  // consultations — 상담 방식/예약 모드/후보 일정 컬럼 추가
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN meeting_type TEXT DEFAULT 'in_person'"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN meeting_link TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN schedule_mode TEXT DEFAULT 'slot'"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN booking_slot_id TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN preferred_date_1 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN preferred_time_1 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN preferred_date_2 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN preferred_time_2 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN preferred_date_3 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN preferred_time_3 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN attachment_urls TEXT"); } catch (e) { warnMigrationSkip(e); }

  // lectures 테이블에 thumbnail_url 컬럼 추가 (이미 있으면 무시)
  try { sqlite.exec("ALTER TABLE lectures ADD COLUMN thumbnail_url TEXT"); } catch (e) { warnMigrationSkip(e); }

  // blog_posts SEO 컬럼 및 버전 히스토리 테이블 추가 (이미 있으면 무시)
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN seo_title TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN seo_description TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN canonical_url TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN og_image_url TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN geo_summary TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN geo_faq TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN geo_keywords TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN footnotes TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN tags TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_posts ADD COLUMN scheduled_publish_at TEXT"); } catch (e) { warnMigrationSkip(e); }
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS blog_post_versions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        version_no INTEGER NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        category TEXT NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        author TEXT,
        thumbnail_url TEXT,
        tags TEXT,
        seo_title TEXT,
        seo_description TEXT,
        canonical_url TEXT,
        og_image_url TEXT,
        geo_summary TEXT,
        geo_faq TEXT,
        geo_keywords TEXT,
        footnotes TEXT,
        is_published INTEGER NOT NULL DEFAULT 0,
        published_at TEXT,
        scheduled_publish_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_by TEXT DEFAULT 'admin'
      );
      CREATE INDEX IF NOT EXISTS idx_blog_post_versions_post_id ON blog_post_versions(post_id, version_no);
    `);
  } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_view_events ADD COLUMN ip_masked TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_view_events ADD COLUMN ip_hash TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_post_versions ADD COLUMN tags TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_post_versions ADD COLUMN scheduled_publish_at TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_post_versions ADD COLUMN footnotes TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_post_versions ADD COLUMN geo_summary TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_post_versions ADD COLUMN geo_faq TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE blog_post_versions ADD COLUMN geo_keywords TEXT"); } catch (e) { warnMigrationSkip(e); }
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS blog_view_events (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        slug TEXT NOT NULL,
        visitor_id TEXT NOT NULL,
        event_key TEXT NOT NULL UNIQUE,
        referrer TEXT,
        user_agent TEXT,
        ip_masked TEXT,
        ip_hash TEXT,
        session_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_blog_view_events_post_id ON blog_view_events(post_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_blog_view_events_slug ON blog_view_events(slug, created_at);
      CREATE INDEX IF NOT EXISTS idx_blog_view_events_created_at ON blog_view_events(created_at);
    `);
  } catch (e) { warnMigrationSkip(e); }

  // lawyers 프로필 확장 컬럼 (이미 있으면 무시)
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN name_hanja TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN team TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN tagline TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN qualifications TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN publications TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN books TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN media TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN columns TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN cases TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN memberships TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN consult_hours TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN blog_url TEXT"); } catch (e) { warnMigrationSkip(e); }

  // 경력 필드의 강의 항목을 lectures 테이블로 자동 마이그레이션
  try {
    const LECTURE_KW = ["강의", "강사", "교수", "출강", "특강", "세미나"];
    const allLawyers = sqlite.prepare("SELECT id, career FROM lawyers").all();
    const checkLec = sqlite.prepare("SELECT count(*) as c FROM lectures WHERE lawyer_id = ? AND title = ?");
    const insertLec = sqlite.prepare(
      "INSERT INTO lectures (id, lawyer_id, title, is_published, sort_order, created_at, updated_at) VALUES (?, ?, ?, 1, ?, datetime('now'), datetime('now'))"
    );
    let migrated = 0;
    for (const lw of allLawyers) {
      let items = [];
      try { items = JSON.parse(lw.career || "[]"); } catch { items = (lw.career || "").split("\n").filter(Boolean); }
      let order = 0;
      for (const item of items) {
        const title = typeof item === "string" ? item : item?.title || item?.description || "";
        if (!title || !LECTURE_KW.some((kw) => title.includes(kw))) continue;
        if (checkLec.get(lw.id, title).c > 0) continue;
        insertLec.run(crypto.randomUUID(), lw.id, title, order++);
        migrated++;
      }
    }
    if (migrated > 0) console.log(`[db] 경력→강의 자동 마이그레이션: ${migrated}건`);
  } catch (e) { console.warn("[db] 강의 마이그레이션 실패:", e.message); }

  // 강의 상세 내용·이미지 자동 채우기 (description이 NULL인 항목만)
  try {
    const lectureDetails = {
      "동아대 법전원 민사법 기록형 + 법조윤리 특강": {
        description: "동아대학교 법학전문대학원 재학생을 대상으로 변호사시험 민사법 기록형 실전 대비 특강과 법조윤리 집중 강의를 진행하였습니다.\n\n기록형 시험의 출제 경향과 고득점 답안 작성 전략을 분석하고, 실제 기출문제를 활용한 모의 풀이를 통해 시간 관리와 쟁점 포착 능력을 훈련하였습니다. 법조윤리 파트에서는 변호사법·변호사윤리장전의 핵심 조문을 실무 사례와 연결하여 강의하였습니다.",
        organizer: "동아대학교 법학전문대학원",
        thumbnailUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
      },
      "아주대 법전원 민사법 기록형 특강": {
        description: "아주대학교 법학전문대학원에서 민사법 기록형 시험 준비를 위한 집중 특강을 진행하였습니다.\n\n민사소송의 소장·답변서·준비서면 작성 실무를 중심으로, 요건사실 정리법과 청구취지 특정 기법을 체계적으로 전달하였습니다. 최근 3개년 기출 분석을 통해 출제 패턴을 파악하고, 수험생이 자주 실수하는 논점을 집중 보강하였습니다.",
        organizer: "아주대학교 법학전문대학원",
        thumbnailUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
      },
      "경기대 행정복지상담대학원 부동산 사법·공법 강의": {
        description: "경기대학교 행정복지상담대학원 석사과정 학생들을 대상으로 부동산 관련 사법과 공법의 교차 영역을 체계적으로 강의하였습니다.\n\n부동산 매매계약의 법적 구조, 등기의 공신력 문제, 명의신탁 규제를 사법 영역에서 다루고, 건축허가·개발행위허가·도시계획 변경 등 공법적 규제 체계를 실무 관점에서 분석하였습니다. 실제 분쟁 사례를 통해 사법과 공법이 교차하는 지점의 리스크를 조명하였습니다.",
        organizer: "경기대학교 행정복지상담대학원",
        thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      },
      "경찰인재개발원 행정소송법 강의": {
        description: "경찰인재개발원에서 경찰 간부를 대상으로 행정소송법의 기본 체계와 경찰 업무 관련 쟁점을 강의하였습니다.\n\n행정처분의 적법성 판단 기준, 취소소송과 무효확인소송의 구별, 집행정지 요건 등 실무에서 빈번하게 문제되는 사항을 판례 중심으로 설명하였습니다. 경찰 행정처분(영업정지, 허가취소 등)에 대한 불복 절차와 대응 전략을 구체적 사례와 함께 다루었습니다.",
        organizer: "경찰인재개발원",
        thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
      },
      "서울지방변호사회·한국사내변호사회 법률 AI 특강": {
        description: "서울지방변호사회와 한국사내변호사회 공동 주최로, 법률 실무에서의 AI 활용 현황과 전략을 다루는 특강을 진행하였습니다.\n\nChatGPT, Claude 등 대규모 언어모델의 법률 리서치 활용법, AI 기반 계약서 검토 자동화, 판례 분석 효율화 방안을 실습과 함께 소개하였습니다. AI 활용 시 발생할 수 있는 윤리적·법적 이슈(환각 현상, 기밀 유출 위험, 변호사 책임 범위)도 심도 있게 논의하였습니다.",
        organizer: "서울지방변호사회·한국사내변호사회",
        thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      },
      "법무법인(유) 대륙아주 법률 AI 기본·심화강의": {
        description: "법무법인(유) 대륙아주 소속 변호사 및 전문인력을 대상으로 법률 AI 도구의 기본 활용부터 심화 전략까지를 체계적으로 강의하였습니다.\n\n기본 과정에서는 생성형 AI의 작동 원리, 프롬프트 엔지니어링 기법, 법률 문서 초안 작성 실습을 진행하였습니다. 심화 과정에서는 복잡한 법률 쟁점 분석에 AI를 활용하는 워크플로우 설계, 다국어 계약서 검토, AI 보조 법률 의견서 작성 방법론을 다루었습니다.",
        organizer: "법무법인(유) 대륙아주",
        thumbnailUrl: "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80",
      },
      "법무법인(유) 로고스 법률 AI 강의": {
        description: "법무법인(유) 로고스 소속 변호사들을 대상으로 법률 AI 실무 활용 강의를 진행하였습니다.\n\n로펌 업무 환경에 최적화된 AI 도구 활용법을 중심으로, 소송 전략 수립 시 AI 기반 판례 검색과 분석 기법, 계약서 리뷰 자동화 워크플로우를 실습하였습니다. 대형 로펌에서의 AI 도입 사례와 업무 효율화 성과를 공유하고, 향후 리걸테크 발전 방향에 대해 논의하였습니다.",
        organizer: "법무법인(유) 로고스",
        thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
      },
      "(주) 엘박스 법률 AI 강의": {
        description: "리걸테크 기업 (주) 엘박스와 협력하여 법률 AI 솔루션의 실무 적용 방안에 대한 강의를 진행하였습니다.\n\n엘박스 플랫폼을 활용한 판례 데이터 분석, 법률 문서 자동 분류 시스템, AI 기반 법률 리서치 효율화 기법을 소개하였습니다. 리걸테크 스타트업과 법률 전문가의 협업 모델, 데이터 기반 법률 서비스 혁신 전략에 대해서도 다루었습니다.",
        organizer: "(주) 엘박스",
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      },
      "서울지방변호사회 기업법무연수원 법률 AI 강의": {
        description: "서울지방변호사회 기업법무연수원에서 기업 사내변호사와 법무팀 실무자를 대상으로 법률 AI 활용 연수를 진행하였습니다.\n\n기업법무 실무에서의 AI 활용 사례를 중심으로, 계약 관리 자동화, 컴플라이언스 모니터링, 리스크 조기 경보 시스템 구축 방안을 소개하였습니다. 사내변호사가 AI 도구를 활용해 업무 생산성을 높이는 구체적 전략과 도입 시 고려사항을 실습과 함께 다루었습니다.",
        organizer: "서울지방변호사회 기업법무연수원",
        thumbnailUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      },
      "2025 세계한인법률가회(IAKL)·법무법인 정세·여성변호사회 강의": {
        description: "2025년 세계한인법률가회(IAKL) 연례 행사에서 법무법인 정세, 대한변호사협회 여성변호사회와 공동으로 강의를 진행하였습니다.\n\n한국 법률 시장의 AI 전환 동향과 글로벌 리걸테크 트렌드를 비교 분석하고, 해외 한인 법률가들의 AI 도입 사례를 공유하였습니다. 법률 AI가 법조계의 다양성과 접근성 향상에 기여할 수 있는 방안에 대해서도 토론하였습니다.",
        date: "2025",
        organizer: "세계한인법률가회(IAKL)·법무법인 정세·여성변호사회",
        thumbnailUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      },
    };
    const emptyLectures = sqlite.prepare("SELECT id, title FROM lectures WHERE description IS NULL").all();
    const updateLec = sqlite.prepare(
      "UPDATE lectures SET description = ?, organizer = ?, thumbnail_url = ?, date = COALESCE(?, date), updated_at = datetime('now') WHERE id = ?"
    );
    let filled = 0;
    for (const lec of emptyLectures) {
      const detail = lectureDetails[lec.title];
      if (!detail) continue;
      updateLec.run(detail.description, detail.organizer || null, detail.thumbnailUrl || null, detail.date || null, lec.id);
      filled++;
    }
    if (filled > 0) console.log(`[db] 강의 상세 내용 자동 채우기: ${filled}건`);
  } catch (e) { console.warn("[db] 강의 상세 채우기 실패:", e.message); }

  // 분리된 통합 강의 삭제 + 경력 필드에서도 제거
  try {
    const COMBINED = "법무법인(유) 로고스·(주) 엘박스·서울지방변호사회 기업법무연수원 강의";
    sqlite.prepare("DELETE FROM lectures WHERE title = ?").run(COMBINED);
    // 경력 필드에서 통합 텍스트 제거
    const lwRows = sqlite.prepare("SELECT id, career FROM lawyers WHERE career LIKE ?").all(`%${COMBINED}%`);
    for (const lw of lwRows) {
      let career = [];
      try { career = JSON.parse(lw.career || "[]"); } catch { continue; }
      const filtered = career.filter((c) => c !== COMBINED);
      if (filtered.length !== career.length) {
        sqlite.prepare("UPDATE lawyers SET career = ?, updated_at = datetime('now') WHERE id = ?")
          .run(JSON.stringify(filtered), lw.id);
      }
    }
  } catch (e) { warnMigrationSkip(e); }

  // 윤세환 변호사 강의 보충 (분리 항목 + 신규 강의, 없는 것만 추가)
  try {
    const yoonRow = sqlite.prepare("SELECT id, career FROM lawyers WHERE name = '윤세환'").get();
    if (yoonRow) {
      const extraLectures = [
        {
          title: "법무법인(유) 로고스 법률 AI 강의",
          description: "법무법인(유) 로고스 소속 변호사들을 대상으로 법률 AI 실무 활용 강의를 진행하였습니다.\n\n로펌 업무 환경에 최적화된 AI 도구 활용법을 중심으로, 소송 전략 수립 시 AI 기반 판례 검색과 분석 기법, 계약서 리뷰 자동화 워크플로우를 실습하였습니다. 대형 로펌에서의 AI 도입 사례와 업무 효율화 성과를 공유하고, 향후 리걸테크 발전 방향에 대해 논의하였습니다.",
          organizer: "법무법인(유) 로고스",
          thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
          sortOrder: 6,
        },
        {
          title: "(주) 엘박스 법률 AI 강의",
          description: "리걸테크 기업 (주) 엘박스와 협력하여 법률 AI 솔루션의 실무 적용 방안에 대한 강의를 진행하였습니다.\n\n엘박스 플랫폼을 활용한 판례 데이터 분석, 법률 문서 자동 분류 시스템, AI 기반 법률 리서치 효율화 기법을 소개하였습니다. 리걸테크 스타트업과 법률 전문가의 협업 모델, 데이터 기반 법률 서비스 혁신 전략에 대해서도 다루었습니다.",
          organizer: "(주) 엘박스",
          thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
          sortOrder: 7,
        },
        {
          title: "서울지방변호사회 기업법무연수원 법률 AI 강의",
          description: "서울지방변호사회 기업법무연수원에서 기업 사내변호사와 법무팀 실무자를 대상으로 법률 AI 활용 연수를 진행하였습니다.\n\n기업법무 실무에서의 AI 활용 사례를 중심으로, 계약 관리 자동화, 컴플라이언스 모니터링, 리스크 조기 경보 시스템 구축 방안을 소개하였습니다. 사내변호사가 AI 도구를 활용해 업무 생산성을 높이는 구체적 전략과 도입 시 고려사항을 실습과 함께 다루었습니다.",
          organizer: "서울지방변호사회 기업법무연수원",
          thumbnailUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
          sortOrder: 8,
        },
        {
          title: "2026 여성변호사회 법률 AI 강의",
          description: "대한변호사협회 여성변호사회에서 여성 법조인을 대상으로 법률 AI 활용 특강을 진행하였습니다.\n\n법률 실무에서의 AI 도구 활용법, 생성형 AI를 활용한 법률 리서치와 문서 작성 효율화 방안을 소개하였습니다. 여성 법조인의 커리어 개발에 AI가 기여할 수 있는 방안과 리걸테크 분야의 다양성 확대에 대해서도 논의하였습니다.",
          date: "2026",
          organizer: "대한변호사협회 여성변호사회",
          thumbnailUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80",
          sortOrder: 9,
        },
        {
          title: "2026 서울지방변호사회 의무연수 법률 AI 강의",
          description: "서울지방변호사회 의무연수 프로그램에서 전체 회원 변호사를 대상으로 법률 AI 활용 강의를 진행하였습니다.\n\n변호사 업무에서의 AI 활용 현황과 윤리적 고려사항을 체계적으로 다루고, ChatGPT·Claude 등 생성형 AI의 법률 리서치 활용 실습을 진행하였습니다. AI 활용 시 변호사의 주의의무와 비밀유지의무 등 윤리 규정 준수 방안에 대해 심도 있게 논의하였습니다.",
          date: "2026",
          organizer: "서울지방변호사회",
          thumbnailUrl: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&q=80",
          sortOrder: 10,
        },
      ];
      const chkLec = sqlite.prepare("SELECT count(*) as c FROM lectures WHERE lawyer_id = ? AND title = ?");
      const addLec = sqlite.prepare(
        "INSERT INTO lectures (id, lawyer_id, title, description, date, organizer, thumbnail_url, is_published, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))"
      );
      let added = 0;
      for (const nl of extraLectures) {
        if (chkLec.get(yoonRow.id, nl.title).c > 0) continue;
        addLec.run(crypto.randomUUID(), yoonRow.id, nl.title, nl.description, nl.date || null, nl.organizer, nl.thumbnailUrl, nl.sortOrder);
        added++;
      }
      if (added > 0) console.log(`[db] 강의 보충: ${added}건 추가`);
    }
  } catch (e) { console.warn("[db] 강의 보충 실패:", e.message); }

  // 기존 행에 unsubscribe_token 백필 (NULL인 행만 UUID 생성)
  try {
    const rowsWithoutToken = sqlite.prepare("SELECT id FROM clients WHERE unsubscribe_token IS NULL").all();
    if (rowsWithoutToken.length > 0) {
      const crypto = require("crypto");
      const update = sqlite.prepare("UPDATE clients SET unsubscribe_token = ? WHERE id = ?");
      for (const row of rowsWithoutToken) update.run(crypto.randomUUID(), row.id);
    }
  } catch (e) { console.warn("[db] unsubscribe_token 백필 실패:", e.message); }

  sqlite.exec(`

    CREATE TABLE IF NOT EXISTS case_files (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '접수',
      lawyer_id TEXT,
      description TEXT,
      case_number TEXT,
      court TEXT,
      case_type TEXT,
      plaintiff TEXT,
      defendant TEXT,
      filed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_case_files_client_id ON case_files(client_id);
    CREATE INDEX IF NOT EXISTS idx_case_files_status ON case_files(status);
    -- idx_case_files_case_number 인덱스는 case_number 컬럼이 ALTER TABLE 마이그레이션으로
    -- 추가된 뒤에 만들어야 한다. 옛 DB에는 컬럼이 없어 여기서 만들면 부팅이 죽는다.
    -- 아래 마이그레이션 섹션의 try/catch 블록에서 멱등하게 생성한다.

    CREATE TABLE IF NOT EXISTS case_documents (
      id TEXT PRIMARY KEY,
      case_file_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      uploaded_by TEXT DEFAULT 'admin',
      document_type TEXT,
      submitter TEXT,
      submission_date TEXT,
      description TEXT,
      file_size INTEGER,
      mime_type TEXT,
      original_name TEXT,
      is_visible_to_client INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    -- case_documents 인덱스는 마이그레이션 섹션에서 멱등하게 생성 (옛 DB 호환)

    CREATE TABLE IF NOT EXISTS case_messages (
      id TEXT PRIMARY KEY,
      case_file_id TEXT NOT NULL,
      sender_id TEXT,
      sender_type TEXT NOT NULL DEFAULT 'lawyer',
      content TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS booking_slots (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      consultation_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON booking_slots(date, lawyer_id);

    CREATE TABLE IF NOT EXISTS booking_settings (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL DEFAULT '09:00',
      end_time TEXT NOT NULL DEFAULT '18:00',
      slot_duration INTEGER NOT NULL DEFAULT 60,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS chatbot_qa (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT '일반',
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      messages TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      content TEXT NOT NULL,
      category TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_is_published ON reviews(is_published);

    CREATE TABLE IF NOT EXISTS qna_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parent_id TEXT,
      depth INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_qna_categories_parent ON qna_categories(parent_id);
    CREATE INDEX IF NOT EXISTS idx_qna_categories_depth ON qna_categories(depth);

    CREATE TABLE IF NOT EXISTS qna_questions (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      display_name TEXT,
      anonymity_tier INTEGER NOT NULL DEFAULT 2,
      submitter_name TEXT,
      submitter_contact TEXT,
      submitter_region TEXT,
      answer TEXT,
      answered_by TEXT,
      answered_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reject_reason TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      meta_description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      published_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_qna_questions_category ON qna_questions(category_id);
    CREATE INDEX IF NOT EXISTS idx_qna_questions_status ON qna_questions(status);
    CREATE INDEX IF NOT EXISTS idx_qna_questions_published ON qna_questions(published_at);
    CREATE INDEX IF NOT EXISTS idx_qna_questions_featured ON qna_questions(is_featured, status);

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      unsubscribe_token TEXT,
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
      unsubscribed_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

    -- 인보이스 헤더
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_no TEXT,                       -- 발행 시점 할당 (draft 동안 NULL)
      type TEXT NOT NULL DEFAULT 'simple',   -- simple|tax
      status TEXT NOT NULL DEFAULT 'draft',  -- draft|issued|sent|partial|paid|overdue|cancelled|refunded
      client_id TEXT NOT NULL,
      case_id TEXT,
      supplier_info TEXT,                    -- JSON 스냅샷
      customer_info TEXT,                    -- JSON 스냅샷
      issued_date TEXT,
      due_date TEXT,
      payment_method TEXT,
      subtotal INTEGER NOT NULL DEFAULT 0,
      vat_rate INTEGER NOT NULL DEFAULT 10,
      vat_amount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      paid_amount INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      currency TEXT NOT NULL DEFAULT 'KRW',
      issued_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_no ON invoices(invoice_no) WHERE invoice_no IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON invoices(case_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_issued_date ON invoices(issued_date);

    -- 인보이스 품목
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      specification TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL DEFAULT 0,
      amount INTEGER NOT NULL DEFAULT 0,
      vat_included INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

    -- 인보이스 결제 이력
    CREATE TABLE IF NOT EXISTS invoice_payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      paid_at TEXT NOT NULL,
      amount INTEGER NOT NULL,
      method TEXT,
      reference TEXT,
      notes TEXT,
      recorded_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

    -- 연도·종류별 인보이스 번호 순번 (원자적 할당용)
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      year INTEGER NOT NULL,
      type TEXT NOT NULL,
      last_number INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (year, type)
    );

    -- 인보이스 감사 로그
    CREATE TABLE IF NOT EXISTS invoice_activity_log (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_id TEXT,
      at TEXT NOT NULL DEFAULT (datetime('now')),
      details TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_invoice_activity_log_invoice_id ON invoice_activity_log(invoice_id);
  `);

  // =============================================
  // 전자서명 / 전자계약 시스템 테이블
  // =============================================
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS signatures (
      id TEXT PRIMARY KEY,
      signer_type TEXT NOT NULL DEFAULT 'external',
      signer_id TEXT,
      signer_name TEXT,
      image_url TEXT,
      image_data_uri TEXT,
      strokes_json TEXT,
      width_px INTEGER,
      height_px INTEGER,
      pointer_type TEXT,
      ip_address TEXT,
      user_agent TEXT,
      hash TEXT,
      signed_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_signatures_signer ON signatures(signer_type, signer_id);

    CREATE TABLE IF NOT EXISTS privacy_consents (
      id TEXT PRIMARY KEY,
      consultation_id TEXT,
      client_id TEXT,
      policy_version TEXT NOT NULL,
      policy_text_snapshot TEXT NOT NULL,
      signature_id TEXT NOT NULL,
      agreed_name TEXT,
      agreed_phone TEXT,
      ip_address TEXT,
      user_agent TEXT,
      consented_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_privacy_consents_consultation ON privacy_consents(consultation_id);

    CREATE TABLE IF NOT EXISTS contract_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'engagement',
      content_json TEXT NOT NULL,
      content_html TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_by_admin_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      template_id TEXT,
      type TEXT NOT NULL DEFAULT 'engagement',
      title TEXT NOT NULL,
      client_id TEXT,
      case_file_id TEXT,
      content_json TEXT NOT NULL,
      content_html TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      sent_at TEXT,
      completed_at TEXT,
      cancelled_at TEXT,
      cancel_reason TEXT,
      final_pdf_url TEXT,
      final_hash TEXT,
      created_by_admin_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
    CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);

    CREATE TABLE IF NOT EXISTS contract_parties (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'our_client',
      display_name TEXT NOT NULL,
      legal_name TEXT,
      birthdate TEXT,
      phone_number TEXT,
      phone_last4 TEXT,
      email TEXT,
      verification_level INTEGER NOT NULL DEFAULT 3,
      verification_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      order_index INTEGER NOT NULL DEFAULT 0,
      declined_reason TEXT,
      sent_at TEXT,
      verified_at TEXT,
      signed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contract_parties_contract ON contract_parties(contract_id);

    CREATE TABLE IF NOT EXISTS contract_signature_fields (
      id TEXT PRIMARY KEY,
      contract_id TEXT,
      template_id TEXT,
      party_id TEXT,
      signature_id TEXT,
      field_key TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'our_client',
      label TEXT,
      required INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contract_fields_contract ON contract_signature_fields(contract_id);
    CREATE INDEX IF NOT EXISTS idx_contract_fields_template ON contract_signature_fields(template_id);

    CREATE TABLE IF NOT EXISTS identity_verifications (
      id TEXT PRIMARY KEY,
      context_type TEXT NOT NULL,
      context_id TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'sms_otp',
      phone_number TEXT,
      phone_last4 TEXT,
      challenge_hash TEXT,
      challenge_expires_at TEXT,
      attempts_used INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      verified_at TEXT,
      verified_name TEXT,
      provider_response TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_identity_ver_context ON identity_verifications(context_type, context_id);

    CREATE TABLE IF NOT EXISTS contract_audit_logs (
      id TEXT PRIMARY KEY,
      contract_id TEXT,
      party_id TEXT,
      invitation_id TEXT,
      actor_type TEXT NOT NULL,
      actor_identifier TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_contract ON contract_audit_logs(contract_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON contract_audit_logs(created_at);

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      target_ref TEXT,
      prefilled_name TEXT,
      prefilled_phone TEXT,
      prefilled_email TEXT,
      category TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'sent',
      sent_at TEXT,
      opened_at TEXT,
      completed_at TEXT,
      expires_at TEXT,
      created_by_admin_id TEXT,
      message_log_id TEXT,
      email_message_log_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
    CREATE INDEX IF NOT EXISTS idx_invitations_type ON invitations(type);
    CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      file_name TEXT,
      mime_type TEXT,
      file_size INTEGER,
      vendor TEXT,
      amount INTEGER,
      paid_at TEXT,
      card_name TEXT,
      card_last4 TEXT,
      category TEXT,
      notes TEXT,
      ocr_text TEXT,
      ocr_status TEXT NOT NULL DEFAULT 'pending',
      created_by_admin_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_receipts_paid_at  ON receipts(paid_at);
    CREATE INDEX IF NOT EXISTS idx_receipts_card     ON receipts(card_name);
    CREATE INDEX IF NOT EXISTS idx_receipts_created  ON receipts(created_at);

    -- 결제 카드 사전 등록 (영수증 last4·카드사 매칭용 별칭/색상 라벨)
    CREATE TABLE IF NOT EXISTS payment_cards (
      id TEXT PRIMARY KEY,
      last4 TEXT NOT NULL,
      issuer TEXT,                          -- '신한카드', 'KB국민카드' 등 카드사
      label TEXT NOT NULL,                  -- 사용자 별칭 ('법카-법인', '개인 신한 The')
      color TEXT,                           -- 표시 색상 hex (#3b82f6 등)
      memo TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_payment_cards_last4 ON payment_cards(last4);

    -- ════════════════════════════════════════════════════════════════════
    -- ERP — Time Tracking / Tasks / Court Dates
    -- 변호사 시간 기록(시급제 청구 기반), 사건별 업무 분담, 법정 일정 관리
    -- ════════════════════════════════════════════════════════════════════

    /* time_entries — 변호사가 사건에 사용한 시간 (분 단위)
       active(진행 중) 타이머는 ended_at IS NULL 인 행으로 표현 */
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT NOT NULL REFERENCES lawyers(id) ON DELETE RESTRICT,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      case_id TEXT,                        -- case_results.id 등 사건 식별자(FK 강제 X — 다양한 출처 허용)
      contract_id TEXT,                    -- contracts.id 와 연결 (있을 때만)
      description TEXT NOT NULL,
      activity_type TEXT NOT NULL DEFAULT 'work',  -- work / research / meeting / court / call / email / travel
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_minutes INTEGER,            -- ended_at 시점에 계산 (실시간 타이머는 NULL)
      hourly_rate_krw INTEGER NOT NULL DEFAULT 0,  -- 진행 시점 변호사 시급 스냅샷
      billable INTEGER NOT NULL DEFAULT 1,
      billed INTEGER NOT NULL DEFAULT 0,
      invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
      memo TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_time_entries_lawyer ON time_entries(lawyer_id, started_at);
    CREATE INDEX IF NOT EXISTS idx_time_entries_client ON time_entries(client_id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_case ON time_entries(case_id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_contract ON time_entries(contract_id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_started ON time_entries(started_at);
    CREATE INDEX IF NOT EXISTS idx_time_entries_active ON time_entries(lawyer_id) WHERE ended_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_time_entries_unbilled ON time_entries(client_id, billable, billed);

    /* tasks — 사건/계약/일반 업무 단위
       assignee_lawyer_id NULL 가능 — 미배정 상태 */
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assignee_lawyer_id TEXT REFERENCES lawyers(id) ON DELETE SET NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      case_id TEXT,
      contract_id TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',  -- low / medium / high / urgent
      status TEXT NOT NULL DEFAULT 'open',       -- open / in_progress / blocked / done / archived
      due_date TEXT,                              -- ISO 날짜
      reminder_at TEXT,                           -- 이전 알림 시각
      completed_at TEXT,
      completed_by TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_lawyer_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_case ON tasks(case_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date) WHERE status NOT IN ('done', 'archived');

    /* court_dates — 재판 / 변론 / 조정 등 법정 일정
       deadline_type — 기일/기한 구분 */
    CREATE TABLE IF NOT EXISTS court_dates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      court_name TEXT,                       -- '서울중앙지방법원' 등
      court_room TEXT,                        -- '제427호 법정'
      case_number TEXT,                       -- '2026가단123456'
      case_id TEXT,                           -- 내부 case_id 연결 (있을 때)
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      lawyer_id TEXT REFERENCES lawyers(id) ON DELETE SET NULL,
      kind TEXT NOT NULL DEFAULT 'hearing',   -- hearing / mediation / examination / sentencing / deadline
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      reminder_at TEXT,
      reminded INTEGER NOT NULL DEFAULT 0,
      memo TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled / completed / postponed / cancelled
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_court_dates_starts ON court_dates(starts_at, status);
    CREATE INDEX IF NOT EXISTS idx_court_dates_lawyer ON court_dates(lawyer_id, starts_at);
    CREATE INDEX IF NOT EXISTS idx_court_dates_client ON court_dates(client_id);
    CREATE INDEX IF NOT EXISTS idx_court_dates_case ON court_dates(case_id);
    CREATE INDEX IF NOT EXISTS idx_court_dates_reminder ON court_dates(reminder_at, reminded) WHERE reminder_at IS NOT NULL AND reminded = 0;

    -- ════════════════════════════════════════════════════════════════════
    -- ERP — Trust Account (의뢰인 예치금 / 신탁 계좌)
    -- 변호사 사무실은 의뢰인 자금(예치금)을 사무실 자금과 분리 관리해야 한다.
    -- 모든 입금/출금/조정은 ledger 행으로 기록하고, 잔액은 합산으로 도출한다.
    -- ════════════════════════════════════════════════════════════════════

    /* trust_transactions — 의뢰인별 예치금 원장
       deposit(+) / withdrawal(-) / adjustment(±) — amount_krw 가 부호를 가진다.
       reference_type/id 로 송장·영수증과 연결 가능 */
    CREATE TABLE IF NOT EXISTS trust_transactions (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      transaction_type TEXT NOT NULL,           -- deposit / withdrawal / adjustment
      amount_krw INTEGER NOT NULL,              -- 부호 있는 금액 (deposit > 0, withdrawal < 0)
      description TEXT NOT NULL,
      reference_type TEXT,                      -- invoice / receipt / manual / refund
      reference_id TEXT,
      occurred_at TEXT NOT NULL,                -- 거래 실제 발생 시각
      recorded_by TEXT,                         -- admin username
      memo TEXT,
      voided_at TEXT,                           -- 취소 처리 시 (잔액 계산에서 제외)
      voided_by TEXT,
      void_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_trust_tx_client ON trust_transactions(client_id, occurred_at);
    CREATE INDEX IF NOT EXISTS idx_trust_tx_occurred ON trust_transactions(occurred_at);
    CREATE INDEX IF NOT EXISTS idx_trust_tx_type ON trust_transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_trust_tx_active ON trust_transactions(client_id) WHERE voided_at IS NULL;
  `);

  // 기존 테이블에 컬럼 추가 (멱등)
  // consultations: 개인정보 동의 서명/초대 연결
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN consent_id TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE consultations ADD COLUMN invitation_id TEXT"); } catch (e) { warnMigrationSkip(e); }
  // message_logs: 발송 컨텍스트 JSON 메타
  try { sqlite.exec("ALTER TABLE message_logs ADD COLUMN metadata TEXT"); } catch (e) { warnMigrationSkip(e); }

  // contract_templates: 변수 스키마 (의뢰인 정보·금액 등 발행 시 입력받는 필드 정의)
  try { sqlite.exec("ALTER TABLE contract_templates ADD COLUMN variables_schema TEXT"); } catch (e) { warnMigrationSkip(e); }

  // signatures: 정밀 서명 메타(평균 압력·기울기·획 통계) — 위변조 검증·법정 증거 강화
  try { sqlite.exec("ALTER TABLE signatures ADD COLUMN avg_pressure REAL"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE signatures ADD COLUMN max_pressure REAL"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE signatures ADD COLUMN stroke_count INTEGER"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE signatures ADD COLUMN total_duration_ms INTEGER"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE signatures ADD COLUMN avg_velocity REAL"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE signatures ADD COLUMN screen_dpi REAL"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE signatures ADD COLUMN orientation TEXT"); } catch (e) { warnMigrationSkip(e); }

  // receipts — AI OCR 사용량/비용 + 품목 JSON
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN ai_model TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN ai_input_tokens INTEGER"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN ai_output_tokens INTEGER"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN ai_cost_usd REAL"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN ai_cost_krw REAL"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN ai_confidence REAL"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN items_json TEXT"); } catch (e) { warnMigrationSkip(e); }
  // 등록된 카드와의 명시적 연결 (자동 매칭 + 사용자 수동 보정)
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN payment_card_id TEXT"); } catch (e) { warnMigrationSkip(e); }

  // payment_cards / receipts — 카드번호 앞 4자리(BIN)
  // 일부 영수증은 끝 4자리 대신 앞 4자리만 마스킹 해제하여 보여주므로 둘 다 매칭에 사용한다.
  try { sqlite.exec("ALTER TABLE payment_cards ADD COLUMN first4 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE receipts ADD COLUMN card_first4 TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE INDEX IF NOT EXISTS idx_payment_cards_first4 ON payment_cards(first4)"); } catch (e) { warnMigrationSkip(e); }

  // lawyers — ERP 시간 청구 기본 시급 (KRW). 0 이면 청구 불가/미설정.
  try { sqlite.exec("ALTER TABLE lawyers ADD COLUMN default_hourly_rate_krw INTEGER NOT NULL DEFAULT 0"); } catch (e) { warnMigrationSkip(e); }

  // case_files — 전자소송 호환 메타데이터 (사건번호/원고/피고/재판부 등)
  try { sqlite.exec("ALTER TABLE case_files ADD COLUMN case_number TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_files ADD COLUMN court TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_files ADD COLUMN case_type TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_files ADD COLUMN plaintiff TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_files ADD COLUMN defendant TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_files ADD COLUMN filed_at TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE INDEX IF NOT EXISTS idx_case_files_case_number ON case_files(case_number)"); } catch (e) { warnMigrationSkip(e); }

  // case_documents — 사건 기록 메타데이터 (제출일자/문서 종류/제출자/요지)
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN document_type TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN submitter TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN submission_date TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN description TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN file_size INTEGER"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN mime_type TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN original_name TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE case_documents ADD COLUMN is_visible_to_client INTEGER NOT NULL DEFAULT 1"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE INDEX IF NOT EXISTS idx_case_documents_case_file_id ON case_documents(case_file_id)"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE INDEX IF NOT EXISTS idx_case_documents_submission_date ON case_documents(submission_date)"); } catch (e) { warnMigrationSkip(e); }

  // ── client_activities: 의뢰인 소통 기록 (통화/메모/자료 수신/이메일 등) ──
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS client_activities (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      type TEXT NOT NULL,          -- call_out, call_in, note, file, email_in, email_out, visit, other
      title TEXT,
      content TEXT,
      file_url TEXT,
      file_name TEXT,
      file_size INTEGER,
      duration_seconds INTEGER,    -- 통화 시간(초)
      occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_client_activities_client ON client_activities(client_id, occurred_at);
    CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(type);

    -- ════════════════════════════════════════════════════════════════════
    -- 레퍼럴 링크 — 상담 안내 문구 공유 + 클릭 추적
    -- ════════════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS referral_links (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      label TEXT,
      memo TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      click_count INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
    CREATE INDEX IF NOT EXISTS idx_referral_links_active ON referral_links(is_active);

    CREATE TABLE IF NOT EXISTS referral_clicks (
      id TEXT PRIMARY KEY,
      referral_link_id TEXT NOT NULL,
      ip_masked TEXT,
      user_agent TEXT,
      referrer TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_referral_clicks_link ON referral_clicks(referral_link_id, created_at);

    -- ════════════════════════════════════════════════════════════════════
    -- 카카오 로그인 사용자 + 세션
    -- ════════════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS kakao_users (
      id TEXT PRIMARY KEY,
      kakao_id TEXT NOT NULL UNIQUE,
      nickname TEXT,
      profile_image TEXT,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_kakao_users_kakao_id ON kakao_users(kakao_id);

    CREATE TABLE IF NOT EXISTS kakao_sessions (
      token_hash TEXT PRIMARY KEY,
      kakao_user_id TEXT NOT NULL,
      kakao_id TEXT NOT NULL,
      nickname TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_kakao_sessions_user ON kakao_sessions(kakao_user_id);
    CREATE INDEX IF NOT EXISTS idx_kakao_sessions_created ON kakao_sessions(created_at);
  `);

  // qna_questions — 비밀글 + 카카오 사용자 연결 컬럼
  try { sqlite.exec("ALTER TABLE qna_questions ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE qna_questions ADD COLUMN password_hash TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE qna_questions ADD COLUMN kakao_user_id TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE INDEX IF NOT EXISTS idx_qna_questions_kakao_user ON qna_questions(kakao_user_id)"); } catch (e) { warnMigrationSkip(e); }

  // portal_users — 구글 캘린더 OAuth2 토큰 컬럼 (포털 사용자 개인 캘린더 연동용)
  try { sqlite.exec("ALTER TABLE portal_users ADD COLUMN google_access_token TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_users ADD COLUMN google_refresh_token TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_users ADD COLUMN google_token_expires_at INTEGER"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_users ADD COLUMN role TEXT"); } catch (e) { warnMigrationSkip(e); }

  // portal_time_entries — 포털 사용자(직원/변호사)의 사건별 시간 기록
  // time_entries(변호사 ERP용)와 별도로 관리하여 포털 자기서비스 방식을 지원한다.
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS portal_time_entries (
        id TEXT PRIMARY KEY,
        portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
        case_id TEXT REFERENCES case_files(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_minutes INTEGER,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_portal_time_entries_user ON portal_time_entries(portal_user_id, started_at);
      CREATE INDEX IF NOT EXISTS idx_portal_time_entries_case ON portal_time_entries(case_id);
      CREATE INDEX IF NOT EXISTS idx_portal_time_entries_active ON portal_time_entries(portal_user_id) WHERE ended_at IS NULL;
    `);
  } catch (e) { warnMigrationSkip(e); }

  // recruit_posts — 채용 공고
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS recruit_posts (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL DEFAULT 'new_lawyer',
        title TEXT NOT NULL,
        description TEXT,
        requirements TEXT,
        benefits TEXT,
        application_deadline TEXT,
        application_file_url TEXT,
        application_file_name TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        is_published INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_recruit_posts_category ON recruit_posts(category);
      CREATE INDEX IF NOT EXISTS idx_recruit_posts_is_published ON recruit_posts(is_published);
    `);
  } catch (e) { warnMigrationSkip(e); }

  // departments — 부서 정보
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        manager_user_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
    `);
  } catch (e) { warnMigrationSkip(e); }

  // portal_approvals — 전자결재
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS portal_approvals (
        id TEXT PRIMARY KEY,
        requester_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        current_approver_id TEXT,
        approval_line TEXT NOT NULL,
        leave_type TEXT,
        leave_start TEXT,
        leave_end TEXT,
        leave_duration REAL,
        expense_amount INTEGER,
        expense_category TEXT,
        expense_receipt_url TEXT,
        expense_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_portal_approvals_requester ON portal_approvals(requester_id);
      CREATE INDEX IF NOT EXISTS idx_portal_approvals_status ON portal_approvals(status);
    `);
  } catch (e) { warnMigrationSkip(e); }

  // portal_users — 입사일, 부서, 직급 컬럼 추가
  try { sqlite.exec("ALTER TABLE portal_users ADD COLUMN hire_date TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_users ADD COLUMN department_id TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_users ADD COLUMN position TEXT"); } catch (e) { warnMigrationSkip(e); }

  // portal_events — attendee_ids 컬럼 추가
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN attendee_ids TEXT"); } catch (e) { warnMigrationSkip(e); }

  // portal_events — 일정 등록 모달 확장 항목(장소/화상회의/첨부파일/범주/반복/알림) 컬럼 추가
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN location TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN video_conference_url TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN attachment_urls TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN category TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN recurrence_rule TEXT"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN reminder_minutes INTEGER"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("ALTER TABLE portal_events ADD COLUMN reminded INTEGER NOT NULL DEFAULT 0"); } catch (e) { warnMigrationSkip(e); }
  try { sqlite.exec("CREATE INDEX IF NOT EXISTS idx_portal_events_reminder ON portal_events(reminder_minutes, reminded)"); } catch (e) { warnMigrationSkip(e); }

  // user_ai_configs — 구성원별 AI 연동 설정
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user_ai_configs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        model_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        encrypted_api_key TEXT NOT NULL,
        is_default_prompt INTEGER NOT NULL DEFAULT 0,
        is_default_image INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_user_ai_configs_user ON user_ai_configs(user_id);
    `);
  } catch (e) { warnMigrationSkip(e); }

  // portal_board_categories — 포털 게시판 카테고리 (대표변호사가 자유롭게 추가 가능)
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS portal_board_categories (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#64748b',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_by TEXT REFERENCES portal_users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } catch (e) { warnMigrationSkip(e); }

  // portal_board_categories — 기존에 하드코딩돼 있던 4개 카테고리를 기본값으로 시드
  // (이미 portal_posts.category 에 사용 중인 키이므로 동일한 key로 미리 채워 둬야
  //  기존 게시글이 새 카테고리 목록에서도 그대로 보인다. UNIQUE(key) + INSERT OR IGNORE로
  //  재실행 시에도 중복 삽입되지 않는다.)
  try {
    const crypto = require("crypto");
    const defaultCategories = [
      { key: "notice", label: "공지사항", color: "#ef4444", sortOrder: 0 },
      { key: "manual", label: "업무 매뉴얼", color: "#3b82f6", sortOrder: 1 },
      { key: "free", label: "자유게시판", color: "#10b981", sortOrder: 2 },
      { key: "template", label: "양식", color: "#8b5cf6", sortOrder: 3 },
    ];
    const insertCategory = sqlite.prepare(
      "INSERT OR IGNORE INTO portal_board_categories (id, key, label, color, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    for (const category of defaultCategories) {
      insertCategory.run(crypto.randomUUID(), category.key, category.label, category.color, category.sortOrder);
    }
  } catch (e) { console.warn("[db] portal_board_categories 기본값 시드 실패:", e.message); }

  // portal_member_groups — 캘린더에서 함께 보고 싶은 구성원을 이름 지어 저장하는 그룹 (사용자별)
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS portal_member_groups (
        id TEXT PRIMARY KEY,
        portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        member_ids TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    sqlite.exec("CREATE INDEX IF NOT EXISTS idx_portal_member_groups_user ON portal_member_groups(portal_user_id);");
  } catch (e) { warnMigrationSkip(e); }

  },
};
