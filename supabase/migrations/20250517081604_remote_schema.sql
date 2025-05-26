create extension if not exists "ltree" with schema "public" version '1.2';

create extension if not exists "postgis" with schema "public" version '3.3.7';

create type "public"."attempt_status" as enum ('success', 'failure');

create type "public"."day_of_week" as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

create type "public"."goal_status" as enum ('active', 'completed', 'archived');

create type "public"."habit_frequency" as enum ('daily', 'weekly', 'custom');

create type "public"."streak_status" as enum ('active', 'ended');

create table "public"."ai_chat_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "message" text not null,
    "response" text not null,
    "timestamp" timestamp with time zone default now()
);


alter table "public"."ai_chat_sessions" enable row level security;

create table "public"."appointments" (
    "id" uuid not null default uuid_generate_v4(),
    "client_id" uuid,
    "therapist_id" uuid,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "status" text,
    "notes" text,
    "meeting_link" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."appointments" enable row level security;

create table "public"."categories" (
    "id" text not null,
    "name" text not null,
    "color" text not null default '#FF7F50'::text,
    "description" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."chat_messages" (
    "id" uuid not null default uuid_generate_v4(),
    "session_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "is_ai" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "detected_mood" text,
    "sentiment_score" double precision
);


create table "public"."chat_sessions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "last_message_at" timestamp with time zone default now(),
    "session_name" text,
    "summary" text
);


create table "public"."check_ins" (
    "id" uuid not null default gen_random_uuid(),
    "streak_id" uuid,
    "check_date" date not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."class_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "course_name" text,
    "course_code" text,
    "room" text,
    "instructor" text,
    "frequency" text,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "days_of_week" text,
    "semester_start" date,
    "semester_end" date,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "semester_id" uuid not null,
    "notification_preference" text,
    "type" text
);


create table "public"."community_posts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "content" text not null,
    "is_anonymous" boolean default false,
    "created_at" timestamp with time zone default now(),
    "title" text,
    "edited_at" timestamp with time zone,
    "media_url" text[],
    "view_count" integer default 0
);


create table "public"."content_queue" (
    "id" uuid not null default uuid_generate_v4(),
    "content_type" text,
    "title" text not null,
    "description" text,
    "url" text not null,
    "source" text,
    "tags" text[],
    "processed" boolean default false,
    "created_at" timestamp with time zone default now()
);


create table "public"."goals" (
    "id" uuid not null default gen_random_uuid(),
    "plan_id" uuid,
    "description" text not null,
    "target_date" timestamp with time zone,
    "status" goal_status default 'active'::goal_status,
    "created_at" timestamp with time zone default now()
);


create table "public"."habits" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "frequency" habit_frequency not null,
    "custom_days" day_of_week[],
    "created_at" timestamp with time zone default now()
);


create table "public"."journal_entries" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "entry_date" date not null,
    "content" text,
    "voice_note_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "mood_type" text,
    "mood_intensity" integer
);


alter table "public"."journal_entries" enable row level security;

create table "public"."mood_entries" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "mood_type" character varying not null,
    "intensity" integer not null,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "day_of_week" integer not null
);


create table "public"."mood_summaries" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "week_start_date" date not null,
    "week_end_date" date not null,
    "dominant_mood" character varying not null,
    "mood_fluctuation" double precision not null,
    "insights" text[],
    "recommendations" text[],
    "created_at" timestamp with time zone default now()
);


create table "public"."notifications" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "title" text not null,
    "description" text not null,
    "category" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now()
);


create table "public"."post_likes" (
    "post_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."post_likes" enable row level security;

create table "public"."post_replies" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid,
    "user_id" uuid,
    "parent_id" uuid,
    "content" text not null,
    "media_url" text[],
    "created_at" timestamp with time zone default now(),
    "edited_at" timestamp with time zone,
    "thread_path" ltree
);


alter table "public"."post_replies" enable row level security;

create table "public"."post_tag_relations" (
    "post_id" uuid not null,
    "tag_id" uuid not null
);


create table "public"."post_tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "color" text not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."profiles" (
    "id" uuid not null,
    "username" text,
    "avatar_url" text,
    "is_anonymous" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "student_id" text,
    "gender" text,
    "interests" text[],
    "primary_goal" text,
    "onboarding_completed" boolean default false,
    "profile_completion_percentage" integer default 40,
    "notification_preferences" jsonb default '{"tips": false, "reminders": true, "achievements": true, "weeklyReport": true}'::jsonb,
    "bio" text,
    "occupation" text,
    "university" text,
    "push_token" text,
    "full_name" text,
    "saved_resources" uuid[] default '{}'::uuid[],
    "last_recommendation_update" timestamp with time zone default now()
);


create table "public"."progress_archive" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "date" date not null,
    "has_routine_completion" boolean default false,
    "has_journal_entry" boolean default false,
    "has_sleep_entry" boolean default false,
    "streak_count" integer default 0,
    "sleep_quality_rating" integer,
    "mood_rating" integer,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."progress_archive" enable row level security;

create table "public"."recommendations" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "resource_id" uuid,
    "reason" text,
    "relevance_score" numeric(5,2),
    "is_viewed" boolean default false,
    "created_at" timestamp with time zone default now()
);


create table "public"."resource_categories" (
    "resource_id" uuid not null,
    "category_id" uuid not null
);


create table "public"."resource_content" (
    "id" uuid not null default uuid_generate_v4(),
    "resource_id" uuid,
    "content_type" text not null,
    "article_content" text,
    "media_url" text,
    "media_thumbnail" text,
    "media_duration" integer,
    "book_preview_url" text,
    "book_purchase_url" text,
    "transcript" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."resource_tags" (
    "resource_id" uuid not null,
    "tag_id" uuid not null
);


create table "public"."resources" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "description" text not null,
    "content_type" text not null,
    "thumbnail_url" text not null,
    "source" text not null,
    "author" text,
    "duration" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_featured" boolean default false,
    "is_premium" boolean default false,
    "view_count" integer default 0,
    "average_rating" numeric(3,2) default 0,
    "url" text
);


create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null
);


create table "public"."routine_completions" (
    "id" uuid not null default uuid_generate_v4(),
    "routine_id" uuid,
    "user_id" uuid,
    "completion_date" date not null,
    "completed_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "status" text not null,
    "notes" text
);


alter table "public"."routine_completions" enable row level security;

create table "public"."routines" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "title" text not null,
    "frequency" text not null,
    "custom_days" text[] default '{}'::text[],
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "color" text default '#FF7F50'::text,
    "icon" text default 'flame'::text,
    "is_active" boolean default true,
    "notification_time" time without time zone,
    "notification_enabled" boolean default true
);


alter table "public"."routines" enable row level security;

create table "public"."schedules" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "course_name" text not null,
    "day_of_week" day_of_week not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "location" text,
    "recurrence_pattern" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."semesters" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "start_date" date,
    "end_date" date,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "type" text,
    "user_id" uuid not null,
    "status" text not null default 'inactive'::text
);


alter table "public"."semesters" enable row level security;

create table "public"."sleep_data" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "sleep_date" date not null,
    "sleep_time" time without time zone not null,
    "wake_time" time without time zone not null,
    "total_hours" numeric(4,2) not null,
    "quality_rating" integer not null,
    "deep_sleep_minutes" integer,
    "rem_sleep_minutes" integer,
    "light_sleep_minutes" integer,
    "awake_minutes" integer,
    "heart_rate_avg" integer,
    "respiratory_rate_avg" numeric(4,2),
    "sleep_environment_rating" integer,
    "caffeine_consumed" boolean,
    "alcohol_consumed" boolean,
    "exercise_before_sleep" boolean,
    "screen_time_before_sleep" boolean,
    "stress_level" integer,
    "mood_next_day" integer,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."sleep_data" enable row level security;

create table "public"."sleep_data_tags" (
    "sleep_data_id" uuid not null,
    "tag_id" uuid not null
);


create table "public"."sleep_goals" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "target_hours" numeric(4,2) not null,
    "target_bedtime" time without time zone,
    "target_wake_time" time without time zone,
    "start_date" date not null,
    "end_date" date,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."sleep_goals" enable row level security;

create table "public"."sleep_insights" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "insight_text" text not null,
    "insight_type" text not null,
    "start_date" date not null,
    "end_date" date not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."sleep_insights" enable row level security;

create table "public"."sleep_tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."streaks" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "title" text not null,
    "type" text not null,
    "status" text not null default 'active'::text,
    "start_date" timestamp with time zone not null,
    "start_time" timestamp with time zone not null,
    "current_streak" integer not null default 0,
    "longest_streak" integer not null default 0,
    "target_count" integer not null default 30,
    "color" text default '#FF7F50'::text,
    "icon" text default 'flame'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."tags" (
    "id" uuid not null default uuid_generate_v4(),
    "identifier" text not null,
    "name" text not null,
    "category_id" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."therapist_availability_exceptions" (
    "id" uuid not null default uuid_generate_v4(),
    "therapist_id" uuid not null,
    "date" date not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "is_available" boolean not null,
    "reason" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."therapist_availability_exceptions" enable row level security;

create table "public"."therapist_profiles" (
    "id" uuid not null,
    "specialization" text[],
    "qualifications" text[],
    "consultation_rates" numeric,
    "availability" jsonb,
    "bio" text,
    "verified" boolean default false,
    "email" text
);


alter table "public"."therapist_profiles" enable row level security;

create table "public"."therapist_reviews" (
    "id" uuid not null default uuid_generate_v4(),
    "therapist_id" uuid not null,
    "client_id" uuid not null,
    "appointment_id" uuid,
    "rating" integer not null,
    "review_text" text,
    "is_anonymous" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."therapist_reviews" enable row level security;

create table "public"."user_goals" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "goal" text not null,
    "priority" integer,
    "created_at" timestamp with time zone default now()
);


create table "public"."user_interests" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "interest" text not null,
    "created_at" timestamp with time zone default now(),
    "category" text
);


alter table "public"."user_interests" enable row level security;

create table "public"."user_post_preferences" (
    "user_id" uuid not null,
    "post_id" uuid not null,
    "is_muted" boolean default false,
    "is_not_interested" boolean default false,
    "created_at" timestamp with time zone default now()
);


create table "public"."user_preferences" (
    "user_id" uuid not null,
    "preferred_categories" uuid[] default '{}'::uuid[],
    "preferred_tags" uuid[] default '{}'::uuid[],
    "content_preferences" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."user_recommendations" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "resource_id" uuid,
    "recommendation_score" real default 0,
    "reason" text,
    "created_at" timestamp with time zone default now(),
    "shown_at" timestamp with time zone,
    "clicked" boolean default false
);


alter table "public"."user_recommendations" enable row level security;

create table "public"."user_roles" (
    "user_id" uuid not null,
    "role_id" uuid not null
);


create table "public"."user_saved_resources" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "resource_id" uuid,
    "saved_at" timestamp with time zone default now()
);


alter table "public"."user_saved_resources" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "email" character varying(255) not null,
    "role" character varying(50) not null default 'user'::character varying,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_sign_in_at" timestamp with time zone,
    "email_confirmed_at" timestamp with time zone,
    "phone" character varying(15),
    "raw_app_meta_data" jsonb,
    "raw_user_meta_data" jsonb
);


alter table "public"."users" enable row level security;

create table "public"."wellness_plans" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX ai_chat_sessions_pkey ON public.ai_chat_sessions USING btree (id);

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE UNIQUE INDEX chat_sessions_pkey ON public.chat_sessions USING btree (id);

CREATE UNIQUE INDEX check_ins_pkey ON public.check_ins USING btree (id);

CREATE UNIQUE INDEX check_ins_streak_id_check_date_key ON public.check_ins USING btree (streak_id, check_date);

CREATE INDEX check_ins_streak_id_idx ON public.check_ins USING btree (streak_id);

CREATE UNIQUE INDEX class_schedules_pkey ON public.class_schedules USING btree (id);

CREATE UNIQUE INDEX community_posts_pkey ON public.community_posts USING btree (id);

CREATE UNIQUE INDEX content_queue_pkey ON public.content_queue USING btree (id);

CREATE UNIQUE INDEX goals_pkey ON public.goals USING btree (id);

CREATE UNIQUE INDEX habits_pkey ON public.habits USING btree (id);

CREATE INDEX idx_appointments_client_time ON public.appointments USING btree (client_id, start_time);

CREATE INDEX idx_appointments_therapist_time ON public.appointments USING btree (therapist_id, start_time);

CREATE INDEX idx_availability_exceptions_therapist_date ON public.therapist_availability_exceptions USING btree (therapist_id, date);

CREATE INDEX idx_community_posts_created ON public.community_posts USING btree (created_at);

CREATE INDEX idx_habits_user ON public.habits USING btree (user_id);

CREATE INDEX idx_journal_entries_date ON public.journal_entries USING btree (entry_date);

CREATE INDEX idx_journal_entries_user_id ON public.journal_entries USING btree (user_id);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);

CREATE INDEX idx_progress_archive_date ON public.progress_archive USING btree (date);

CREATE INDEX idx_progress_archive_user_id ON public.progress_archive USING btree (user_id);

CREATE INDEX idx_resource_categories_category_id ON public.resource_categories USING btree (category_id);

CREATE INDEX idx_resource_tags_tag_id ON public.resource_tags USING btree (tag_id);

CREATE INDEX idx_resources_created_at ON public.resources USING btree (created_at DESC);

CREATE INDEX idx_resources_type_featured ON public.resources USING btree (content_type, is_featured);

CREATE INDEX idx_resources_url ON public.resources USING btree (url);

CREATE INDEX idx_reviews_therapist ON public.therapist_reviews USING btree (therapist_id);

CREATE INDEX idx_routine_completions_date ON public.routine_completions USING btree (completion_date);

CREATE INDEX idx_routine_completions_routine_id ON public.routine_completions USING btree (routine_id);

CREATE INDEX idx_routine_completions_user_id ON public.routine_completions USING btree (user_id);

CREATE INDEX idx_routines_user_id ON public.routines USING btree (user_id);

CREATE UNIQUE INDEX idx_semesters_active_user ON public.semesters USING btree (user_id) WHERE (status = 'active'::text);

CREATE INDEX idx_tags_identifier ON public.tags USING btree (identifier);

CREATE INDEX idx_user_interests_category ON public.user_interests USING btree (category);

CREATE INDEX idx_user_interests_user_id ON public.user_interests USING btree (user_id);

CREATE INDEX idx_user_recommendations_user_id ON public.user_recommendations USING btree (user_id);

CREATE INDEX idx_user_saved_resources_user_id ON public.user_saved_resources USING btree (user_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_role ON public.users USING btree (role);

CREATE UNIQUE INDEX journal_entries_pkey ON public.journal_entries USING btree (id);

CREATE UNIQUE INDEX mood_entries_pkey ON public.mood_entries USING btree (id);

CREATE UNIQUE INDEX mood_summaries_pkey ON public.mood_summaries USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (post_id, user_id);

CREATE UNIQUE INDEX post_replies_pkey ON public.post_replies USING btree (id);

CREATE UNIQUE INDEX post_tag_relations_pkey ON public.post_tag_relations USING btree (post_id, tag_id);

CREATE UNIQUE INDEX post_tags_name_key ON public.post_tags USING btree (name);

CREATE UNIQUE INDEX post_tags_pkey ON public.post_tags USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_student_id_key ON public.profiles USING btree (student_id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX progress_archive_pkey ON public.progress_archive USING btree (id);

CREATE UNIQUE INDEX progress_archive_user_id_date_key ON public.progress_archive USING btree (user_id, date);

CREATE UNIQUE INDEX recommendations_pkey ON public.recommendations USING btree (id);

CREATE UNIQUE INDEX recommendations_user_id_resource_id_key ON public.recommendations USING btree (user_id, resource_id);

CREATE UNIQUE INDEX resource_categories_pkey ON public.resource_categories USING btree (resource_id, category_id);

CREATE UNIQUE INDEX resource_content_pkey ON public.resource_content USING btree (id);

CREATE UNIQUE INDEX resource_tags_pkey ON public.resource_tags USING btree (resource_id, tag_id);

CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id);

CREATE UNIQUE INDEX resources_url_key ON public.resources USING btree (url);

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX routine_completions_pkey ON public.routine_completions USING btree (id);

CREATE UNIQUE INDEX routine_completions_routine_id_completion_date_key ON public.routine_completions USING btree (routine_id, completion_date);

CREATE UNIQUE INDEX routines_pkey ON public.routines USING btree (id);

CREATE UNIQUE INDEX schedules_pkey ON public.schedules USING btree (id);

CREATE UNIQUE INDEX semesters_pkey ON public.semesters USING btree (id);

CREATE UNIQUE INDEX sleep_data_pkey ON public.sleep_data USING btree (id);

CREATE UNIQUE INDEX sleep_data_tags_pkey ON public.sleep_data_tags USING btree (sleep_data_id, tag_id);

CREATE UNIQUE INDEX sleep_data_user_id_sleep_date_key ON public.sleep_data USING btree (user_id, sleep_date);

CREATE UNIQUE INDEX sleep_goals_pkey ON public.sleep_goals USING btree (id);

CREATE UNIQUE INDEX sleep_insights_pkey ON public.sleep_insights USING btree (id);

CREATE UNIQUE INDEX sleep_insights_user_id_insight_type_start_date_end_date_key ON public.sleep_insights USING btree (user_id, insight_type, start_date, end_date);

CREATE UNIQUE INDEX sleep_tags_name_key ON public.sleep_tags USING btree (name);

CREATE UNIQUE INDEX sleep_tags_pkey ON public.sleep_tags USING btree (id);

CREATE UNIQUE INDEX streaks_pkey ON public.streaks USING btree (id);

CREATE UNIQUE INDEX tags_identifier_key ON public.tags USING btree (identifier);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX therapist_availability_except_therapist_id_date_start_time__key ON public.therapist_availability_exceptions USING btree (therapist_id, date, start_time, end_time);

CREATE UNIQUE INDEX therapist_availability_exceptions_pkey ON public.therapist_availability_exceptions USING btree (id);

CREATE UNIQUE INDEX therapist_profiles_pkey ON public.therapist_profiles USING btree (id);

CREATE UNIQUE INDEX therapist_reviews_client_id_appointment_id_key ON public.therapist_reviews USING btree (client_id, appointment_id);

CREATE UNIQUE INDEX therapist_reviews_pkey ON public.therapist_reviews USING btree (id);

CREATE UNIQUE INDEX user_goals_pkey ON public.user_goals USING btree (id);

CREATE UNIQUE INDEX user_interests_pkey ON public.user_interests USING btree (id);

CREATE UNIQUE INDEX user_post_preferences_pkey ON public.user_post_preferences USING btree (user_id, post_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_recommendations_pkey ON public.user_recommendations USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id, role_id);

CREATE UNIQUE INDEX user_saved_resources_pkey ON public.user_saved_resources USING btree (id);

CREATE UNIQUE INDEX user_saved_resources_user_id_resource_id_key ON public.user_saved_resources USING btree (user_id, resource_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX wellness_plans_pkey ON public.wellness_plans USING btree (id);

alter table "public"."ai_chat_sessions" add constraint "ai_chat_sessions_pkey" PRIMARY KEY using index "ai_chat_sessions_pkey";

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."chat_sessions" add constraint "chat_sessions_pkey" PRIMARY KEY using index "chat_sessions_pkey";

alter table "public"."check_ins" add constraint "check_ins_pkey" PRIMARY KEY using index "check_ins_pkey";

alter table "public"."class_schedules" add constraint "class_schedules_pkey" PRIMARY KEY using index "class_schedules_pkey";

alter table "public"."community_posts" add constraint "community_posts_pkey" PRIMARY KEY using index "community_posts_pkey";

alter table "public"."content_queue" add constraint "content_queue_pkey" PRIMARY KEY using index "content_queue_pkey";

alter table "public"."goals" add constraint "goals_pkey" PRIMARY KEY using index "goals_pkey";

alter table "public"."habits" add constraint "habits_pkey" PRIMARY KEY using index "habits_pkey";

alter table "public"."journal_entries" add constraint "journal_entries_pkey" PRIMARY KEY using index "journal_entries_pkey";

alter table "public"."mood_entries" add constraint "mood_entries_pkey" PRIMARY KEY using index "mood_entries_pkey";

alter table "public"."mood_summaries" add constraint "mood_summaries_pkey" PRIMARY KEY using index "mood_summaries_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."post_likes" add constraint "post_likes_pkey" PRIMARY KEY using index "post_likes_pkey";

alter table "public"."post_replies" add constraint "post_replies_pkey" PRIMARY KEY using index "post_replies_pkey";

alter table "public"."post_tag_relations" add constraint "post_tag_relations_pkey" PRIMARY KEY using index "post_tag_relations_pkey";

alter table "public"."post_tags" add constraint "post_tags_pkey" PRIMARY KEY using index "post_tags_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."progress_archive" add constraint "progress_archive_pkey" PRIMARY KEY using index "progress_archive_pkey";

alter table "public"."recommendations" add constraint "recommendations_pkey" PRIMARY KEY using index "recommendations_pkey";

alter table "public"."resource_categories" add constraint "resource_categories_pkey" PRIMARY KEY using index "resource_categories_pkey";

alter table "public"."resource_content" add constraint "resource_content_pkey" PRIMARY KEY using index "resource_content_pkey";

alter table "public"."resource_tags" add constraint "resource_tags_pkey" PRIMARY KEY using index "resource_tags_pkey";

alter table "public"."resources" add constraint "resources_pkey" PRIMARY KEY using index "resources_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."routine_completions" add constraint "routine_completions_pkey" PRIMARY KEY using index "routine_completions_pkey";

alter table "public"."routines" add constraint "routines_pkey" PRIMARY KEY using index "routines_pkey";

alter table "public"."schedules" add constraint "schedules_pkey" PRIMARY KEY using index "schedules_pkey";

alter table "public"."semesters" add constraint "semesters_pkey" PRIMARY KEY using index "semesters_pkey";

alter table "public"."sleep_data" add constraint "sleep_data_pkey" PRIMARY KEY using index "sleep_data_pkey";

alter table "public"."sleep_data_tags" add constraint "sleep_data_tags_pkey" PRIMARY KEY using index "sleep_data_tags_pkey";

alter table "public"."sleep_goals" add constraint "sleep_goals_pkey" PRIMARY KEY using index "sleep_goals_pkey";

alter table "public"."sleep_insights" add constraint "sleep_insights_pkey" PRIMARY KEY using index "sleep_insights_pkey";

alter table "public"."sleep_tags" add constraint "sleep_tags_pkey" PRIMARY KEY using index "sleep_tags_pkey";

alter table "public"."streaks" add constraint "streaks_pkey" PRIMARY KEY using index "streaks_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."therapist_availability_exceptions" add constraint "therapist_availability_exceptions_pkey" PRIMARY KEY using index "therapist_availability_exceptions_pkey";

alter table "public"."therapist_profiles" add constraint "therapist_profiles_pkey" PRIMARY KEY using index "therapist_profiles_pkey";

alter table "public"."therapist_reviews" add constraint "therapist_reviews_pkey" PRIMARY KEY using index "therapist_reviews_pkey";

alter table "public"."user_goals" add constraint "user_goals_pkey" PRIMARY KEY using index "user_goals_pkey";

alter table "public"."user_interests" add constraint "user_interests_pkey" PRIMARY KEY using index "user_interests_pkey";

alter table "public"."user_post_preferences" add constraint "user_post_preferences_pkey" PRIMARY KEY using index "user_post_preferences_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_recommendations" add constraint "user_recommendations_pkey" PRIMARY KEY using index "user_recommendations_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."user_saved_resources" add constraint "user_saved_resources_pkey" PRIMARY KEY using index "user_saved_resources_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."wellness_plans" add constraint "wellness_plans_pkey" PRIMARY KEY using index "wellness_plans_pkey";

alter table "public"."ai_chat_sessions" add constraint "ai_chat_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."ai_chat_sessions" validate constraint "ai_chat_sessions_user_id_fkey";

alter table "public"."appointments" add constraint "appointments_client_id_fkey" FOREIGN KEY (client_id) REFERENCES auth.users(id) not valid;

alter table "public"."appointments" validate constraint "appointments_client_id_fkey";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."appointments" add constraint "appointments_therapist_id_fkey" FOREIGN KEY (therapist_id) REFERENCES auth.users(id) not valid;

alter table "public"."appointments" validate constraint "appointments_therapist_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_session_id_fkey" FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_session_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_user_id_fkey";

alter table "public"."chat_sessions" add constraint "chat_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_sessions" validate constraint "chat_sessions_user_id_fkey";

alter table "public"."check_ins" add constraint "check_ins_streak_id_check_date_key" UNIQUE using index "check_ins_streak_id_check_date_key";

alter table "public"."class_schedules" add constraint "class_schedules_semester_id_fkey" FOREIGN KEY (semester_id) REFERENCES semesters(id) not valid;

alter table "public"."class_schedules" validate constraint "class_schedules_semester_id_fkey";

alter table "public"."class_schedules" add constraint "class_schedules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."class_schedules" validate constraint "class_schedules_user_id_fkey";

alter table "public"."community_posts" add constraint "community_posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."community_posts" validate constraint "community_posts_user_id_fkey";

alter table "public"."content_queue" add constraint "content_queue_content_type_check" CHECK ((content_type = ANY (ARRAY['article'::text, 'podcast'::text, 'video'::text]))) not valid;

alter table "public"."content_queue" validate constraint "content_queue_content_type_check";

alter table "public"."goals" add constraint "goals_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES wellness_plans(id) ON DELETE CASCADE not valid;

alter table "public"."goals" validate constraint "goals_plan_id_fkey";

alter table "public"."habits" add constraint "habits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."habits" validate constraint "habits_user_id_fkey";

alter table "public"."journal_entries" add constraint "journal_entries_mood_intensity_check" CHECK (((mood_intensity >= 1) AND (mood_intensity <= 10))) not valid;

alter table "public"."journal_entries" validate constraint "journal_entries_mood_intensity_check";

alter table "public"."journal_entries" add constraint "journal_entries_mood_type_check" CHECK ((mood_type = ANY (ARRAY['happy'::text, 'calm'::text, 'stressed'::text, 'angry'::text, 'sad'::text]))) not valid;

alter table "public"."journal_entries" validate constraint "journal_entries_mood_type_check";

alter table "public"."journal_entries" add constraint "journal_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."journal_entries" validate constraint "journal_entries_user_id_fkey";

alter table "public"."mood_entries" add constraint "mood_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."mood_entries" validate constraint "mood_entries_user_id_fkey";

alter table "public"."mood_summaries" add constraint "mood_summaries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."mood_summaries" validate constraint "mood_summaries_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_user_id_fkey";

alter table "public"."post_replies" add constraint "post_replies_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES post_replies(id) ON DELETE CASCADE not valid;

alter table "public"."post_replies" validate constraint "post_replies_parent_id_fkey";

alter table "public"."post_replies" add constraint "post_replies_post_id_fkey" FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_replies" validate constraint "post_replies_post_id_fkey";

alter table "public"."post_replies" add constraint "post_replies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_replies" validate constraint "post_replies_user_id_fkey";

alter table "public"."post_tag_relations" add constraint "post_tag_relations_post_id_fkey" FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_tag_relations" validate constraint "post_tag_relations_post_id_fkey";

alter table "public"."post_tag_relations" add constraint "post_tag_relations_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES post_tags(id) ON DELETE CASCADE not valid;

alter table "public"."post_tag_relations" validate constraint "post_tag_relations_tag_id_fkey";

alter table "public"."post_tags" add constraint "post_tags_name_key" UNIQUE using index "post_tags_name_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_student_id_key" UNIQUE using index "profiles_student_id_key";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."progress_archive" add constraint "progress_archive_user_id_date_key" UNIQUE using index "progress_archive_user_id_date_key";

alter table "public"."progress_archive" add constraint "progress_archive_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."progress_archive" validate constraint "progress_archive_user_id_fkey";

alter table "public"."recommendations" add constraint "recommendations_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."recommendations" validate constraint "recommendations_resource_id_fkey";

alter table "public"."recommendations" add constraint "recommendations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."recommendations" validate constraint "recommendations_user_id_fkey";

alter table "public"."recommendations" add constraint "recommendations_user_id_resource_id_key" UNIQUE using index "recommendations_user_id_resource_id_key";

alter table "public"."resource_categories" add constraint "resource_categories_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."resource_categories" validate constraint "resource_categories_resource_id_fkey";

alter table "public"."resource_content" add constraint "resource_content_content_type_check" CHECK ((content_type = ANY (ARRAY['article'::text, 'video'::text, 'podcast'::text, 'book'::text]))) not valid;

alter table "public"."resource_content" validate constraint "resource_content_content_type_check";

alter table "public"."resource_content" add constraint "resource_content_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."resource_content" validate constraint "resource_content_resource_id_fkey";

alter table "public"."resource_tags" add constraint "resource_tags_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."resource_tags" validate constraint "resource_tags_resource_id_fkey";

alter table "public"."resources" add constraint "resources_content_type_check" CHECK ((content_type = ANY (ARRAY['article'::text, 'video'::text, 'podcast'::text, 'book'::text]))) not valid;

alter table "public"."resources" validate constraint "resources_content_type_check";

alter table "public"."resources" add constraint "resources_url_key" UNIQUE using index "resources_url_key";

alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key";

alter table "public"."routine_completions" add constraint "routine_completions_routine_id_completion_date_key" UNIQUE using index "routine_completions_routine_id_completion_date_key";

alter table "public"."routine_completions" add constraint "routine_completions_routine_id_fkey" FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE not valid;

alter table "public"."routine_completions" validate constraint "routine_completions_routine_id_fkey";

alter table "public"."routine_completions" add constraint "routine_completions_status_check" CHECK ((status = ANY (ARRAY['completed'::text, 'missed'::text, 'pending'::text]))) not valid;

alter table "public"."routine_completions" validate constraint "routine_completions_status_check";

alter table "public"."routine_completions" add constraint "routine_completions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."routine_completions" validate constraint "routine_completions_user_id_fkey";

alter table "public"."routines" add constraint "routines_frequency_check" CHECK ((frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'custom'::text]))) not valid;

alter table "public"."routines" validate constraint "routines_frequency_check";

alter table "public"."routines" add constraint "routines_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."routines" validate constraint "routines_user_id_fkey";

alter table "public"."schedules" add constraint "schedules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."schedules" validate constraint "schedules_user_id_fkey";

alter table "public"."semesters" add constraint "semesters_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."semesters" validate constraint "semesters_status_check";

alter table "public"."semesters" add constraint "semesters_type_check" CHECK ((length(type) <= 50)) not valid;

alter table "public"."semesters" validate constraint "semesters_type_check";

alter table "public"."semesters" add constraint "semesters_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."semesters" validate constraint "semesters_user_id_fkey";

alter table "public"."sleep_data" add constraint "sleep_data_mood_next_day_check" CHECK (((mood_next_day >= 1) AND (mood_next_day <= 10))) not valid;

alter table "public"."sleep_data" validate constraint "sleep_data_mood_next_day_check";

alter table "public"."sleep_data" add constraint "sleep_data_quality_rating_check" CHECK (((quality_rating >= 1) AND (quality_rating <= 10))) not valid;

alter table "public"."sleep_data" validate constraint "sleep_data_quality_rating_check";

alter table "public"."sleep_data" add constraint "sleep_data_sleep_environment_rating_check" CHECK (((sleep_environment_rating >= 1) AND (sleep_environment_rating <= 10))) not valid;

alter table "public"."sleep_data" validate constraint "sleep_data_sleep_environment_rating_check";

alter table "public"."sleep_data" add constraint "sleep_data_stress_level_check" CHECK (((stress_level >= 1) AND (stress_level <= 10))) not valid;

alter table "public"."sleep_data" validate constraint "sleep_data_stress_level_check";

alter table "public"."sleep_data" add constraint "sleep_data_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."sleep_data" validate constraint "sleep_data_user_id_fkey";

alter table "public"."sleep_data" add constraint "sleep_data_user_id_sleep_date_key" UNIQUE using index "sleep_data_user_id_sleep_date_key";

alter table "public"."sleep_data_tags" add constraint "sleep_data_tags_sleep_data_id_fkey" FOREIGN KEY (sleep_data_id) REFERENCES sleep_data(id) ON DELETE CASCADE not valid;

alter table "public"."sleep_data_tags" validate constraint "sleep_data_tags_sleep_data_id_fkey";

alter table "public"."sleep_data_tags" add constraint "sleep_data_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES sleep_tags(id) ON DELETE CASCADE not valid;

alter table "public"."sleep_data_tags" validate constraint "sleep_data_tags_tag_id_fkey";

alter table "public"."sleep_goals" add constraint "sleep_goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."sleep_goals" validate constraint "sleep_goals_user_id_fkey";

alter table "public"."sleep_insights" add constraint "sleep_insights_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."sleep_insights" validate constraint "sleep_insights_user_id_fkey";

alter table "public"."sleep_insights" add constraint "sleep_insights_user_id_insight_type_start_date_end_date_key" UNIQUE using index "sleep_insights_user_id_insight_type_start_date_end_date_key";

alter table "public"."sleep_tags" add constraint "sleep_tags_name_key" UNIQUE using index "sleep_tags_name_key";

alter table "public"."streaks" add constraint "streaks_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'broken'::text]))) not valid;

alter table "public"."streaks" validate constraint "streaks_status_check";

alter table "public"."streaks" add constraint "streaks_type_check" CHECK ((type = ANY (ARRAY['build'::text, 'break'::text]))) not valid;

alter table "public"."streaks" validate constraint "streaks_type_check";

alter table "public"."streaks" add constraint "streaks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."streaks" validate constraint "streaks_user_id_fkey";

alter table "public"."tags" add constraint "tags_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) not valid;

alter table "public"."tags" validate constraint "tags_category_id_fkey";

alter table "public"."tags" add constraint "tags_identifier_key" UNIQUE using index "tags_identifier_key";

alter table "public"."therapist_availability_exceptions" add constraint "therapist_availability_except_therapist_id_date_start_time__key" UNIQUE using index "therapist_availability_except_therapist_id_date_start_time__key";

alter table "public"."therapist_availability_exceptions" add constraint "therapist_availability_exceptions_therapist_id_fkey" FOREIGN KEY (therapist_id) REFERENCES therapist_profiles(id) not valid;

alter table "public"."therapist_availability_exceptions" validate constraint "therapist_availability_exceptions_therapist_id_fkey";

alter table "public"."therapist_profiles" add constraint "therapist_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."therapist_profiles" validate constraint "therapist_profiles_id_fkey";

alter table "public"."therapist_reviews" add constraint "therapist_reviews_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES appointments(id) not valid;

alter table "public"."therapist_reviews" validate constraint "therapist_reviews_appointment_id_fkey";

alter table "public"."therapist_reviews" add constraint "therapist_reviews_client_id_appointment_id_key" UNIQUE using index "therapist_reviews_client_id_appointment_id_key";

alter table "public"."therapist_reviews" add constraint "therapist_reviews_client_id_fkey" FOREIGN KEY (client_id) REFERENCES auth.users(id) not valid;

alter table "public"."therapist_reviews" validate constraint "therapist_reviews_client_id_fkey";

alter table "public"."therapist_reviews" add constraint "therapist_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."therapist_reviews" validate constraint "therapist_reviews_rating_check";

alter table "public"."therapist_reviews" add constraint "therapist_reviews_therapist_id_fkey" FOREIGN KEY (therapist_id) REFERENCES therapist_profiles(id) not valid;

alter table "public"."therapist_reviews" validate constraint "therapist_reviews_therapist_id_fkey";

alter table "public"."user_goals" add constraint "user_goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_goals" validate constraint "user_goals_user_id_fkey";

alter table "public"."user_interests" add constraint "user_interests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interests" validate constraint "user_interests_user_id_fkey";

alter table "public"."user_post_preferences" add constraint "user_post_preferences_post_id_fkey" FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE not valid;

alter table "public"."user_post_preferences" validate constraint "user_post_preferences_post_id_fkey";

alter table "public"."user_post_preferences" add constraint "user_post_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_post_preferences" validate constraint "user_post_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_recommendations" add constraint "user_recommendations_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."user_recommendations" validate constraint "user_recommendations_resource_id_fkey";

alter table "public"."user_recommendations" add constraint "user_recommendations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_recommendations" validate constraint "user_recommendations_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_saved_resources" add constraint "user_saved_resources_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."user_saved_resources" validate constraint "user_saved_resources_resource_id_fkey";

alter table "public"."user_saved_resources" add constraint "user_saved_resources_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_saved_resources" validate constraint "user_saved_resources_user_id_fkey";

alter table "public"."user_saved_resources" add constraint "user_saved_resources_user_id_resource_id_key" UNIQUE using index "user_saved_resources_user_id_resource_id_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'therapist'::character varying, 'admin'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."wellness_plans" add constraint "wellness_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."wellness_plans" validate constraint "wellness_plans_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.book_appointment(p_therapist_id uuid, p_client_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_notes text DEFAULT NULL::text)
 RETURNS appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_appointment appointments;
  conflict_count INTEGER;
BEGIN
  -- Check for conflicts
  SELECT COUNT(*) INTO conflict_count
  FROM appointments
  WHERE therapist_id = p_therapist_id
    AND status IN ('pending', 'confirmed')
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    );
  
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Time slot conflict detected';
  END IF;
  
  -- Get therapist consultation rate
  DECLARE
    consultation_rate INTEGER;
  BEGIN
    SELECT consultation_rates INTO consultation_rate
    FROM therapist_profiles
    WHERE id = p_therapist_id;
    
    -- Calculate session duration in hours and payment amount
    DECLARE
      duration_hours NUMERIC;
      payment_amount INTEGER;
    BEGIN
      duration_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
      payment_amount := ROUND(consultation_rate * duration_hours);
      
      -- Insert new appointment
      INSERT INTO appointments (
        therapist_id,
        client_id,
        start_time,
        end_time,
        status,
        notes,
        payment_amount
      ) VALUES (
        p_therapist_id,
        p_client_id,
        p_start_time,
        p_end_time,
        'pending',
        p_notes,
        payment_amount
      ) RETURNING * INTO new_appointment;
      
      RETURN new_appointment;
    END;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.break_streak(streak_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update streaks
  set 
    status = 'broken',
    updated_at = now()
  where id = streak_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_streak_length(start_date timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
begin
  return extract(day from (now() - start_date));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_complete_routine()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if new.status = 'completed' and 
       new.completion_date < current_date - interval '2 days' then
        raise exception 'Cannot complete routines older than 2 days';
    end if;
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.classify_user_interest(interest_text text, user_uuid uuid, ai_category text DEFAULT NULL::text, confidence real DEFAULT 0.5)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO user_interests (user_id, interest, category, confidence_score)
  VALUES (user_uuid, interest_text, ai_category, confidence)
  ON CONFLICT (user_id, interest) 
  DO UPDATE SET 
    category = EXCLUDED.category,
    confidence_score = EXCLUDED.confidence_score,
    created_at = NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_user_recommendations(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Clear existing recommendations
  DELETE FROM user_recommendations WHERE user_id = user_uuid;
  
  -- Generate new recommendations based on interests and tags
  INSERT INTO user_recommendations (user_id, resource_id, recommendation_score, reason)
  SELECT DISTINCT
    user_uuid,
    r.id,
    CASE 
      WHEN t.identifier IN (SELECT interest FROM user_interests WHERE user_id = user_uuid) THEN 3.0
      WHEN rc.category_id IN (SELECT DISTINCT category FROM user_interests WHERE user_id = user_uuid) THEN 2.0
      ELSE 1.0
    END as score,
    CASE 
      WHEN t.identifier IN (SELECT interest FROM user_interests WHERE user_id = user_uuid) THEN 'Based on your interest in ' || t.name
      WHEN rc.category_id IN (SELECT DISTINCT category FROM user_interests WHERE user_id = user_uuid) THEN 'Based on your interest in ' || c.name
      ELSE 'Trending content'
    END as reason
  FROM resources r
  LEFT JOIN resource_tags rt ON r.id = rt.resource_id
  LEFT JOIN tags t ON rt.tag_id = t.id
  LEFT JOIN resource_categories rc ON r.id = rc.resource_id
  LEFT JOIN categories c ON rc.category_id = c.id
  WHERE r.id NOT IN (SELECT resource_id FROM user_saved_resources WHERE user_id = user_uuid)
  ORDER BY score DESC
  LIMIT 50;
  
  -- Update last recommendation update in profiles table if it exists
  UPDATE profiles 
  SET last_recommendation_update = NOW() 
  WHERE id = user_uuid;
END;
$function$
;

create type "public"."geometry_dump" as ("path" integer[], "geom" geometry);

CREATE OR REPLACE FUNCTION public.get_therapist_available_slots(p_therapist_id uuid, p_date date, p_duration_minutes integer DEFAULT 60)
 RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone, is_available boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  therapist_availability JSONB;
  day_name TEXT;
  day_schedule JSONB;
  start_time TIME;
  end_time TIME;
  current_slot TIMESTAMP WITH TIME ZONE;
  slot_end_time TIMESTAMP WITH TIME ZONE;
  has_conflict BOOLEAN;
BEGIN
  -- Get therapist availability
  SELECT availability INTO therapist_availability
  FROM therapist_profiles
  WHERE id = p_therapist_id;
  
  -- Get day of week
  day_name := LOWER(TO_CHAR(p_date, 'Day'));
  day_name := TRIM(day_name);
  
  -- Get schedule for the day
  day_schedule := therapist_availability->day_name;
  
  IF day_schedule IS NULL THEN
    RETURN;
  END IF;
  
  -- Extract start and end times
  start_time := (day_schedule->>'start')::TIME;
  end_time := (day_schedule->>'end')::TIME;
  
  -- Generate time slots
  current_slot := p_date + start_time;
  
  WHILE current_slot + (p_duration_minutes * INTERVAL '1 minute') <= p_date + end_time LOOP
    slot_end_time := current_slot + (p_duration_minutes * INTERVAL '1 minute');
    
    -- Check for conflicts with existing appointments
    SELECT EXISTS(
      SELECT 1 FROM appointments
      WHERE therapist_id = p_therapist_id
        AND status IN ('pending', 'confirmed')
        AND (
          (start_time <= current_slot AND end_time > current_slot) OR
          (start_time < slot_end_time AND end_time >= slot_end_time) OR
          (start_time >= current_slot AND end_time <= slot_end_time)
        )
    ) INTO has_conflict;
    
    -- Check for availability exceptions
    IF NOT has_conflict THEN
      SELECT EXISTS(
        SELECT 1 FROM therapist_availability_exceptions
        WHERE therapist_id = p_therapist_id
          AND date = p_date
          AND NOT is_available
          AND (
            (start_time <= current_slot::TIME AND end_time > current_slot::TIME) OR
            (start_time < slot_end_time::TIME AND end_time >= slot_end_time::TIME) OR
            (start_time >= current_slot::TIME AND end_time <= slot_end_time::TIME)
          )
      ) INTO has_conflict;
    END IF;
    
    -- Return the slot
    slot_start := current_slot;
    slot_end := slot_end_time;
    is_available := NOT has_conflict;
    
    RETURN NEXT;
    
    -- Move to next slot (30-minute intervals)
    current_slot := current_slot + INTERVAL '30 minutes';
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at, last_sign_in_at, email_confirmed_at, phone, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.created_at,
    NEW.updated_at,
    NEW.last_sign_in_at,
    NEW.email_confirmed_at,
    NEW.phone,
    NEW.raw_app_meta_data,
    NEW.raw_user_meta_data
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    updated_at = NEW.updated_at,
    last_sign_in_at = NEW.last_sign_in_at,
    email_confirmed_at = NEW.email_confirmed_at,
    phone = NEW.phone,
    raw_app_meta_data = NEW.raw_app_meta_data,
    raw_user_meta_data = NEW.raw_user_meta_data
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$
;

create or replace view "public"."post_likes_count" as  SELECT post_likes.post_id,
    count(*) AS likes
   FROM post_likes
  GROUP BY post_likes.post_id;


CREATE OR REPLACE FUNCTION public.reschedule_appointment(p_appointment_id uuid, p_therapist_id uuid, p_new_start_time timestamp with time zone, p_new_end_time timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for conflicts (excluding current appointment)
  SELECT COUNT(*) INTO conflict_count
  FROM appointments
  WHERE therapist_id = p_therapist_id
    AND id != p_appointment_id
    AND status IN ('pending', 'confirmed')
    AND (
      (start_time <= p_new_start_time AND end_time > p_new_start_time) OR
      (start_time < p_new_end_time AND end_time >= p_new_end_time) OR
      (start_time >= p_new_start_time AND end_time <= p_new_end_time)
    );
  
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Time slot conflict detected';
  END IF;
  
  -- Update appointment
  UPDATE appointments
  SET 
    start_time = p_new_start_time,
    end_time = p_new_end_time,
    updated_at = NOW()
  WHERE id = p_appointment_id;
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_streak(streak_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update streaks
  set 
    status = 'active',
    start_date = now(),
    start_time = now(),
    current_streak = 0,
    longest_streak = 0,
    updated_at = now()
  where id = streak_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_sleep_with_progress()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    insert into progress_archive (user_id, date, has_sleep_entry, sleep_quality_rating)
    values (new.user_id, new.sleep_date, true, new.quality_rating)
    on conflict (user_id, date) 
    do update set 
        has_sleep_entry = true,
        sleep_quality_rating = new.quality_rating;
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.terminate_streak(streak_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE streaks 
  SET 
    status = 'completed',
    last_check_in = CURRENT_TIMESTAMP
  WHERE id = streak_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_like(post_id uuid, user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists (
    select 1 from post_likes 
    where post_likes.post_id = toggle_like.post_id 
    and post_likes.user_id = toggle_like.user_id
  ) then
    delete from post_likes 
    where post_id = toggle_like.post_id 
    and user_id = toggle_like.user_id;
  else
    insert into post_likes (post_id, user_id) 
    values (toggle_like.post_id, toggle_like.user_id);
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_generate_recommendations()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM generate_user_recommendations(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_progress_archive()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    -- Update progress archive with routine completion
    insert into progress_archive (user_id, date, has_routine_completion)
    values (new.user_id, new.completion_date, true)
    on conflict (user_id, date) 
    do update set has_routine_completion = true;
    
    -- Update streak count
    update progress_archive
    set streak_count = (
        select count(*)
        from routine_completions rc
        where rc.user_id = new.user_id
        and rc.status = 'completed'
        and rc.completion_date <= new.completion_date
        and rc.completion_date >= new.completion_date - interval '30 days'
    )
    where user_id = new.user_id
    and date = new.completion_date;
    
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_streak_counts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  streak_record streaks%ROWTYPE;
  last_check timestamp with time zone;
  now_date date := CURRENT_DATE;
  check_date date := NEW.check_date;
BEGIN
  -- Get the streak record
  SELECT * INTO streak_record FROM streaks WHERE id = NEW.streak_id;
  
  -- Get the last check-in date
  SELECT MAX(check_date) INTO last_check 
  FROM check_ins 
  WHERE streak_id = NEW.streak_id AND check_date < check_date;
  
  -- First check-in or consecutive day
  IF last_check IS NULL OR check_date = (last_check::date + interval '1 day')::date THEN
    -- Update current streak
    UPDATE streaks SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_check_in = NEW.created_at,
      length = current_streak + 1
    WHERE id = NEW.streak_id;
  -- Same day check-in (ignore)
  ELSIF check_date = last_check::date THEN
    -- Do nothing
    NULL;
  -- Broken streak (not consecutive)
  ELSE
    -- Reset current streak to 1
    UPDATE streaks SET 
      current_streak = 1,
      length = 1,
      last_check_in = NEW.created_at
    WHERE id = NEW.streak_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_streak_length()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.status = 'active' then
    new.current_streak := calculate_streak_length(new.start_date);
    if new.current_streak > new.longest_streak then
      new.longest_streak := new.current_streak;
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$function$
;

create type "public"."valid_detail" as ("valid" boolean, "reason" character varying, "location" geometry);

grant delete on table "public"."ai_chat_sessions" to "anon";

grant insert on table "public"."ai_chat_sessions" to "anon";

grant references on table "public"."ai_chat_sessions" to "anon";

grant select on table "public"."ai_chat_sessions" to "anon";

grant trigger on table "public"."ai_chat_sessions" to "anon";

grant truncate on table "public"."ai_chat_sessions" to "anon";

grant update on table "public"."ai_chat_sessions" to "anon";

grant delete on table "public"."ai_chat_sessions" to "authenticated";

grant insert on table "public"."ai_chat_sessions" to "authenticated";

grant references on table "public"."ai_chat_sessions" to "authenticated";

grant select on table "public"."ai_chat_sessions" to "authenticated";

grant trigger on table "public"."ai_chat_sessions" to "authenticated";

grant truncate on table "public"."ai_chat_sessions" to "authenticated";

grant update on table "public"."ai_chat_sessions" to "authenticated";

grant delete on table "public"."ai_chat_sessions" to "service_role";

grant insert on table "public"."ai_chat_sessions" to "service_role";

grant references on table "public"."ai_chat_sessions" to "service_role";

grant select on table "public"."ai_chat_sessions" to "service_role";

grant trigger on table "public"."ai_chat_sessions" to "service_role";

grant truncate on table "public"."ai_chat_sessions" to "service_role";

grant update on table "public"."ai_chat_sessions" to "service_role";

grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."chat_sessions" to "anon";

grant insert on table "public"."chat_sessions" to "anon";

grant references on table "public"."chat_sessions" to "anon";

grant select on table "public"."chat_sessions" to "anon";

grant trigger on table "public"."chat_sessions" to "anon";

grant truncate on table "public"."chat_sessions" to "anon";

grant update on table "public"."chat_sessions" to "anon";

grant delete on table "public"."chat_sessions" to "authenticated";

grant insert on table "public"."chat_sessions" to "authenticated";

grant references on table "public"."chat_sessions" to "authenticated";

grant select on table "public"."chat_sessions" to "authenticated";

grant trigger on table "public"."chat_sessions" to "authenticated";

grant truncate on table "public"."chat_sessions" to "authenticated";

grant update on table "public"."chat_sessions" to "authenticated";

grant delete on table "public"."chat_sessions" to "service_role";

grant insert on table "public"."chat_sessions" to "service_role";

grant references on table "public"."chat_sessions" to "service_role";

grant select on table "public"."chat_sessions" to "service_role";

grant trigger on table "public"."chat_sessions" to "service_role";

grant truncate on table "public"."chat_sessions" to "service_role";

grant update on table "public"."chat_sessions" to "service_role";

grant delete on table "public"."check_ins" to "anon";

grant insert on table "public"."check_ins" to "anon";

grant references on table "public"."check_ins" to "anon";

grant select on table "public"."check_ins" to "anon";

grant trigger on table "public"."check_ins" to "anon";

grant truncate on table "public"."check_ins" to "anon";

grant update on table "public"."check_ins" to "anon";

grant delete on table "public"."check_ins" to "authenticated";

grant insert on table "public"."check_ins" to "authenticated";

grant references on table "public"."check_ins" to "authenticated";

grant select on table "public"."check_ins" to "authenticated";

grant trigger on table "public"."check_ins" to "authenticated";

grant truncate on table "public"."check_ins" to "authenticated";

grant update on table "public"."check_ins" to "authenticated";

grant delete on table "public"."check_ins" to "service_role";

grant insert on table "public"."check_ins" to "service_role";

grant references on table "public"."check_ins" to "service_role";

grant select on table "public"."check_ins" to "service_role";

grant trigger on table "public"."check_ins" to "service_role";

grant truncate on table "public"."check_ins" to "service_role";

grant update on table "public"."check_ins" to "service_role";

grant delete on table "public"."class_schedules" to "anon";

grant insert on table "public"."class_schedules" to "anon";

grant references on table "public"."class_schedules" to "anon";

grant select on table "public"."class_schedules" to "anon";

grant trigger on table "public"."class_schedules" to "anon";

grant truncate on table "public"."class_schedules" to "anon";

grant update on table "public"."class_schedules" to "anon";

grant delete on table "public"."class_schedules" to "authenticated";

grant insert on table "public"."class_schedules" to "authenticated";

grant references on table "public"."class_schedules" to "authenticated";

grant select on table "public"."class_schedules" to "authenticated";

grant trigger on table "public"."class_schedules" to "authenticated";

grant truncate on table "public"."class_schedules" to "authenticated";

grant update on table "public"."class_schedules" to "authenticated";

grant delete on table "public"."class_schedules" to "service_role";

grant insert on table "public"."class_schedules" to "service_role";

grant references on table "public"."class_schedules" to "service_role";

grant select on table "public"."class_schedules" to "service_role";

grant trigger on table "public"."class_schedules" to "service_role";

grant truncate on table "public"."class_schedules" to "service_role";

grant update on table "public"."class_schedules" to "service_role";

grant delete on table "public"."community_posts" to "anon";

grant insert on table "public"."community_posts" to "anon";

grant references on table "public"."community_posts" to "anon";

grant select on table "public"."community_posts" to "anon";

grant trigger on table "public"."community_posts" to "anon";

grant truncate on table "public"."community_posts" to "anon";

grant update on table "public"."community_posts" to "anon";

grant delete on table "public"."community_posts" to "authenticated";

grant insert on table "public"."community_posts" to "authenticated";

grant references on table "public"."community_posts" to "authenticated";

grant select on table "public"."community_posts" to "authenticated";

grant trigger on table "public"."community_posts" to "authenticated";

grant truncate on table "public"."community_posts" to "authenticated";

grant update on table "public"."community_posts" to "authenticated";

grant delete on table "public"."community_posts" to "service_role";

grant insert on table "public"."community_posts" to "service_role";

grant references on table "public"."community_posts" to "service_role";

grant select on table "public"."community_posts" to "service_role";

grant trigger on table "public"."community_posts" to "service_role";

grant truncate on table "public"."community_posts" to "service_role";

grant update on table "public"."community_posts" to "service_role";

grant delete on table "public"."content_queue" to "anon";

grant insert on table "public"."content_queue" to "anon";

grant references on table "public"."content_queue" to "anon";

grant select on table "public"."content_queue" to "anon";

grant trigger on table "public"."content_queue" to "anon";

grant truncate on table "public"."content_queue" to "anon";

grant update on table "public"."content_queue" to "anon";

grant delete on table "public"."content_queue" to "authenticated";

grant insert on table "public"."content_queue" to "authenticated";

grant references on table "public"."content_queue" to "authenticated";

grant select on table "public"."content_queue" to "authenticated";

grant trigger on table "public"."content_queue" to "authenticated";

grant truncate on table "public"."content_queue" to "authenticated";

grant update on table "public"."content_queue" to "authenticated";

grant delete on table "public"."content_queue" to "service_role";

grant insert on table "public"."content_queue" to "service_role";

grant references on table "public"."content_queue" to "service_role";

grant select on table "public"."content_queue" to "service_role";

grant trigger on table "public"."content_queue" to "service_role";

grant truncate on table "public"."content_queue" to "service_role";

grant update on table "public"."content_queue" to "service_role";

grant delete on table "public"."goals" to "anon";

grant insert on table "public"."goals" to "anon";

grant references on table "public"."goals" to "anon";

grant select on table "public"."goals" to "anon";

grant trigger on table "public"."goals" to "anon";

grant truncate on table "public"."goals" to "anon";

grant update on table "public"."goals" to "anon";

grant delete on table "public"."goals" to "authenticated";

grant insert on table "public"."goals" to "authenticated";

grant references on table "public"."goals" to "authenticated";

grant select on table "public"."goals" to "authenticated";

grant trigger on table "public"."goals" to "authenticated";

grant truncate on table "public"."goals" to "authenticated";

grant update on table "public"."goals" to "authenticated";

grant delete on table "public"."goals" to "service_role";

grant insert on table "public"."goals" to "service_role";

grant references on table "public"."goals" to "service_role";

grant select on table "public"."goals" to "service_role";

grant trigger on table "public"."goals" to "service_role";

grant truncate on table "public"."goals" to "service_role";

grant update on table "public"."goals" to "service_role";

grant delete on table "public"."habits" to "anon";

grant insert on table "public"."habits" to "anon";

grant references on table "public"."habits" to "anon";

grant select on table "public"."habits" to "anon";

grant trigger on table "public"."habits" to "anon";

grant truncate on table "public"."habits" to "anon";

grant update on table "public"."habits" to "anon";

grant delete on table "public"."habits" to "authenticated";

grant insert on table "public"."habits" to "authenticated";

grant references on table "public"."habits" to "authenticated";

grant select on table "public"."habits" to "authenticated";

grant trigger on table "public"."habits" to "authenticated";

grant truncate on table "public"."habits" to "authenticated";

grant update on table "public"."habits" to "authenticated";

grant delete on table "public"."habits" to "service_role";

grant insert on table "public"."habits" to "service_role";

grant references on table "public"."habits" to "service_role";

grant select on table "public"."habits" to "service_role";

grant trigger on table "public"."habits" to "service_role";

grant truncate on table "public"."habits" to "service_role";

grant update on table "public"."habits" to "service_role";

grant delete on table "public"."journal_entries" to "anon";

grant insert on table "public"."journal_entries" to "anon";

grant references on table "public"."journal_entries" to "anon";

grant select on table "public"."journal_entries" to "anon";

grant trigger on table "public"."journal_entries" to "anon";

grant truncate on table "public"."journal_entries" to "anon";

grant update on table "public"."journal_entries" to "anon";

grant delete on table "public"."journal_entries" to "authenticated";

grant insert on table "public"."journal_entries" to "authenticated";

grant references on table "public"."journal_entries" to "authenticated";

grant select on table "public"."journal_entries" to "authenticated";

grant trigger on table "public"."journal_entries" to "authenticated";

grant truncate on table "public"."journal_entries" to "authenticated";

grant update on table "public"."journal_entries" to "authenticated";

grant delete on table "public"."journal_entries" to "service_role";

grant insert on table "public"."journal_entries" to "service_role";

grant references on table "public"."journal_entries" to "service_role";

grant select on table "public"."journal_entries" to "service_role";

grant trigger on table "public"."journal_entries" to "service_role";

grant truncate on table "public"."journal_entries" to "service_role";

grant update on table "public"."journal_entries" to "service_role";

grant delete on table "public"."mood_entries" to "anon";

grant insert on table "public"."mood_entries" to "anon";

grant references on table "public"."mood_entries" to "anon";

grant select on table "public"."mood_entries" to "anon";

grant trigger on table "public"."mood_entries" to "anon";

grant truncate on table "public"."mood_entries" to "anon";

grant update on table "public"."mood_entries" to "anon";

grant delete on table "public"."mood_entries" to "authenticated";

grant insert on table "public"."mood_entries" to "authenticated";

grant references on table "public"."mood_entries" to "authenticated";

grant select on table "public"."mood_entries" to "authenticated";

grant trigger on table "public"."mood_entries" to "authenticated";

grant truncate on table "public"."mood_entries" to "authenticated";

grant update on table "public"."mood_entries" to "authenticated";

grant delete on table "public"."mood_entries" to "service_role";

grant insert on table "public"."mood_entries" to "service_role";

grant references on table "public"."mood_entries" to "service_role";

grant select on table "public"."mood_entries" to "service_role";

grant trigger on table "public"."mood_entries" to "service_role";

grant truncate on table "public"."mood_entries" to "service_role";

grant update on table "public"."mood_entries" to "service_role";

grant delete on table "public"."mood_summaries" to "anon";

grant insert on table "public"."mood_summaries" to "anon";

grant references on table "public"."mood_summaries" to "anon";

grant select on table "public"."mood_summaries" to "anon";

grant trigger on table "public"."mood_summaries" to "anon";

grant truncate on table "public"."mood_summaries" to "anon";

grant update on table "public"."mood_summaries" to "anon";

grant delete on table "public"."mood_summaries" to "authenticated";

grant insert on table "public"."mood_summaries" to "authenticated";

grant references on table "public"."mood_summaries" to "authenticated";

grant select on table "public"."mood_summaries" to "authenticated";

grant trigger on table "public"."mood_summaries" to "authenticated";

grant truncate on table "public"."mood_summaries" to "authenticated";

grant update on table "public"."mood_summaries" to "authenticated";

grant delete on table "public"."mood_summaries" to "service_role";

grant insert on table "public"."mood_summaries" to "service_role";

grant references on table "public"."mood_summaries" to "service_role";

grant select on table "public"."mood_summaries" to "service_role";

grant trigger on table "public"."mood_summaries" to "service_role";

grant truncate on table "public"."mood_summaries" to "service_role";

grant update on table "public"."mood_summaries" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."post_likes" to "anon";

grant insert on table "public"."post_likes" to "anon";

grant references on table "public"."post_likes" to "anon";

grant select on table "public"."post_likes" to "anon";

grant trigger on table "public"."post_likes" to "anon";

grant truncate on table "public"."post_likes" to "anon";

grant update on table "public"."post_likes" to "anon";

grant delete on table "public"."post_likes" to "authenticated";

grant insert on table "public"."post_likes" to "authenticated";

grant references on table "public"."post_likes" to "authenticated";

grant select on table "public"."post_likes" to "authenticated";

grant trigger on table "public"."post_likes" to "authenticated";

grant truncate on table "public"."post_likes" to "authenticated";

grant update on table "public"."post_likes" to "authenticated";

grant delete on table "public"."post_likes" to "service_role";

grant insert on table "public"."post_likes" to "service_role";

grant references on table "public"."post_likes" to "service_role";

grant select on table "public"."post_likes" to "service_role";

grant trigger on table "public"."post_likes" to "service_role";

grant truncate on table "public"."post_likes" to "service_role";

grant update on table "public"."post_likes" to "service_role";

grant delete on table "public"."post_replies" to "anon";

grant insert on table "public"."post_replies" to "anon";

grant references on table "public"."post_replies" to "anon";

grant select on table "public"."post_replies" to "anon";

grant trigger on table "public"."post_replies" to "anon";

grant truncate on table "public"."post_replies" to "anon";

grant update on table "public"."post_replies" to "anon";

grant delete on table "public"."post_replies" to "authenticated";

grant insert on table "public"."post_replies" to "authenticated";

grant references on table "public"."post_replies" to "authenticated";

grant select on table "public"."post_replies" to "authenticated";

grant trigger on table "public"."post_replies" to "authenticated";

grant truncate on table "public"."post_replies" to "authenticated";

grant update on table "public"."post_replies" to "authenticated";

grant delete on table "public"."post_replies" to "service_role";

grant insert on table "public"."post_replies" to "service_role";

grant references on table "public"."post_replies" to "service_role";

grant select on table "public"."post_replies" to "service_role";

grant trigger on table "public"."post_replies" to "service_role";

grant truncate on table "public"."post_replies" to "service_role";

grant update on table "public"."post_replies" to "service_role";

grant delete on table "public"."post_tag_relations" to "anon";

grant insert on table "public"."post_tag_relations" to "anon";

grant references on table "public"."post_tag_relations" to "anon";

grant select on table "public"."post_tag_relations" to "anon";

grant trigger on table "public"."post_tag_relations" to "anon";

grant truncate on table "public"."post_tag_relations" to "anon";

grant update on table "public"."post_tag_relations" to "anon";

grant delete on table "public"."post_tag_relations" to "authenticated";

grant insert on table "public"."post_tag_relations" to "authenticated";

grant references on table "public"."post_tag_relations" to "authenticated";

grant select on table "public"."post_tag_relations" to "authenticated";

grant trigger on table "public"."post_tag_relations" to "authenticated";

grant truncate on table "public"."post_tag_relations" to "authenticated";

grant update on table "public"."post_tag_relations" to "authenticated";

grant delete on table "public"."post_tag_relations" to "service_role";

grant insert on table "public"."post_tag_relations" to "service_role";

grant references on table "public"."post_tag_relations" to "service_role";

grant select on table "public"."post_tag_relations" to "service_role";

grant trigger on table "public"."post_tag_relations" to "service_role";

grant truncate on table "public"."post_tag_relations" to "service_role";

grant update on table "public"."post_tag_relations" to "service_role";

grant delete on table "public"."post_tags" to "anon";

grant insert on table "public"."post_tags" to "anon";

grant references on table "public"."post_tags" to "anon";

grant select on table "public"."post_tags" to "anon";

grant trigger on table "public"."post_tags" to "anon";

grant truncate on table "public"."post_tags" to "anon";

grant update on table "public"."post_tags" to "anon";

grant delete on table "public"."post_tags" to "authenticated";

grant insert on table "public"."post_tags" to "authenticated";

grant references on table "public"."post_tags" to "authenticated";

grant select on table "public"."post_tags" to "authenticated";

grant trigger on table "public"."post_tags" to "authenticated";

grant truncate on table "public"."post_tags" to "authenticated";

grant update on table "public"."post_tags" to "authenticated";

grant delete on table "public"."post_tags" to "service_role";

grant insert on table "public"."post_tags" to "service_role";

grant references on table "public"."post_tags" to "service_role";

grant select on table "public"."post_tags" to "service_role";

grant trigger on table "public"."post_tags" to "service_role";

grant truncate on table "public"."post_tags" to "service_role";

grant update on table "public"."post_tags" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."progress_archive" to "anon";

grant insert on table "public"."progress_archive" to "anon";

grant references on table "public"."progress_archive" to "anon";

grant select on table "public"."progress_archive" to "anon";

grant trigger on table "public"."progress_archive" to "anon";

grant truncate on table "public"."progress_archive" to "anon";

grant update on table "public"."progress_archive" to "anon";

grant delete on table "public"."progress_archive" to "authenticated";

grant insert on table "public"."progress_archive" to "authenticated";

grant references on table "public"."progress_archive" to "authenticated";

grant select on table "public"."progress_archive" to "authenticated";

grant trigger on table "public"."progress_archive" to "authenticated";

grant truncate on table "public"."progress_archive" to "authenticated";

grant update on table "public"."progress_archive" to "authenticated";

grant delete on table "public"."progress_archive" to "service_role";

grant insert on table "public"."progress_archive" to "service_role";

grant references on table "public"."progress_archive" to "service_role";

grant select on table "public"."progress_archive" to "service_role";

grant trigger on table "public"."progress_archive" to "service_role";

grant truncate on table "public"."progress_archive" to "service_role";

grant update on table "public"."progress_archive" to "service_role";

grant delete on table "public"."recommendations" to "anon";

grant insert on table "public"."recommendations" to "anon";

grant references on table "public"."recommendations" to "anon";

grant select on table "public"."recommendations" to "anon";

grant trigger on table "public"."recommendations" to "anon";

grant truncate on table "public"."recommendations" to "anon";

grant update on table "public"."recommendations" to "anon";

grant delete on table "public"."recommendations" to "authenticated";

grant insert on table "public"."recommendations" to "authenticated";

grant references on table "public"."recommendations" to "authenticated";

grant select on table "public"."recommendations" to "authenticated";

grant trigger on table "public"."recommendations" to "authenticated";

grant truncate on table "public"."recommendations" to "authenticated";

grant update on table "public"."recommendations" to "authenticated";

grant delete on table "public"."recommendations" to "service_role";

grant insert on table "public"."recommendations" to "service_role";

grant references on table "public"."recommendations" to "service_role";

grant select on table "public"."recommendations" to "service_role";

grant trigger on table "public"."recommendations" to "service_role";

grant truncate on table "public"."recommendations" to "service_role";

grant update on table "public"."recommendations" to "service_role";

grant delete on table "public"."resource_categories" to "anon";

grant insert on table "public"."resource_categories" to "anon";

grant references on table "public"."resource_categories" to "anon";

grant select on table "public"."resource_categories" to "anon";

grant trigger on table "public"."resource_categories" to "anon";

grant truncate on table "public"."resource_categories" to "anon";

grant update on table "public"."resource_categories" to "anon";

grant delete on table "public"."resource_categories" to "authenticated";

grant insert on table "public"."resource_categories" to "authenticated";

grant references on table "public"."resource_categories" to "authenticated";

grant select on table "public"."resource_categories" to "authenticated";

grant trigger on table "public"."resource_categories" to "authenticated";

grant truncate on table "public"."resource_categories" to "authenticated";

grant update on table "public"."resource_categories" to "authenticated";

grant delete on table "public"."resource_categories" to "service_role";

grant insert on table "public"."resource_categories" to "service_role";

grant references on table "public"."resource_categories" to "service_role";

grant select on table "public"."resource_categories" to "service_role";

grant trigger on table "public"."resource_categories" to "service_role";

grant truncate on table "public"."resource_categories" to "service_role";

grant update on table "public"."resource_categories" to "service_role";

grant delete on table "public"."resource_content" to "anon";

grant insert on table "public"."resource_content" to "anon";

grant references on table "public"."resource_content" to "anon";

grant select on table "public"."resource_content" to "anon";

grant trigger on table "public"."resource_content" to "anon";

grant truncate on table "public"."resource_content" to "anon";

grant update on table "public"."resource_content" to "anon";

grant delete on table "public"."resource_content" to "authenticated";

grant insert on table "public"."resource_content" to "authenticated";

grant references on table "public"."resource_content" to "authenticated";

grant select on table "public"."resource_content" to "authenticated";

grant trigger on table "public"."resource_content" to "authenticated";

grant truncate on table "public"."resource_content" to "authenticated";

grant update on table "public"."resource_content" to "authenticated";

grant delete on table "public"."resource_content" to "service_role";

grant insert on table "public"."resource_content" to "service_role";

grant references on table "public"."resource_content" to "service_role";

grant select on table "public"."resource_content" to "service_role";

grant trigger on table "public"."resource_content" to "service_role";

grant truncate on table "public"."resource_content" to "service_role";

grant update on table "public"."resource_content" to "service_role";

grant delete on table "public"."resource_tags" to "anon";

grant insert on table "public"."resource_tags" to "anon";

grant references on table "public"."resource_tags" to "anon";

grant select on table "public"."resource_tags" to "anon";

grant trigger on table "public"."resource_tags" to "anon";

grant truncate on table "public"."resource_tags" to "anon";

grant update on table "public"."resource_tags" to "anon";

grant delete on table "public"."resource_tags" to "authenticated";

grant insert on table "public"."resource_tags" to "authenticated";

grant references on table "public"."resource_tags" to "authenticated";

grant select on table "public"."resource_tags" to "authenticated";

grant trigger on table "public"."resource_tags" to "authenticated";

grant truncate on table "public"."resource_tags" to "authenticated";

grant update on table "public"."resource_tags" to "authenticated";

grant delete on table "public"."resource_tags" to "service_role";

grant insert on table "public"."resource_tags" to "service_role";

grant references on table "public"."resource_tags" to "service_role";

grant select on table "public"."resource_tags" to "service_role";

grant trigger on table "public"."resource_tags" to "service_role";

grant truncate on table "public"."resource_tags" to "service_role";

grant update on table "public"."resource_tags" to "service_role";

grant delete on table "public"."resources" to "anon";

grant insert on table "public"."resources" to "anon";

grant references on table "public"."resources" to "anon";

grant select on table "public"."resources" to "anon";

grant trigger on table "public"."resources" to "anon";

grant truncate on table "public"."resources" to "anon";

grant update on table "public"."resources" to "anon";

grant delete on table "public"."resources" to "authenticated";

grant insert on table "public"."resources" to "authenticated";

grant references on table "public"."resources" to "authenticated";

grant select on table "public"."resources" to "authenticated";

grant trigger on table "public"."resources" to "authenticated";

grant truncate on table "public"."resources" to "authenticated";

grant update on table "public"."resources" to "authenticated";

grant delete on table "public"."resources" to "service_role";

grant insert on table "public"."resources" to "service_role";

grant references on table "public"."resources" to "service_role";

grant select on table "public"."resources" to "service_role";

grant trigger on table "public"."resources" to "service_role";

grant truncate on table "public"."resources" to "service_role";

grant update on table "public"."resources" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."routine_completions" to "anon";

grant insert on table "public"."routine_completions" to "anon";

grant references on table "public"."routine_completions" to "anon";

grant select on table "public"."routine_completions" to "anon";

grant trigger on table "public"."routine_completions" to "anon";

grant truncate on table "public"."routine_completions" to "anon";

grant update on table "public"."routine_completions" to "anon";

grant delete on table "public"."routine_completions" to "authenticated";

grant insert on table "public"."routine_completions" to "authenticated";

grant references on table "public"."routine_completions" to "authenticated";

grant select on table "public"."routine_completions" to "authenticated";

grant trigger on table "public"."routine_completions" to "authenticated";

grant truncate on table "public"."routine_completions" to "authenticated";

grant update on table "public"."routine_completions" to "authenticated";

grant delete on table "public"."routine_completions" to "service_role";

grant insert on table "public"."routine_completions" to "service_role";

grant references on table "public"."routine_completions" to "service_role";

grant select on table "public"."routine_completions" to "service_role";

grant trigger on table "public"."routine_completions" to "service_role";

grant truncate on table "public"."routine_completions" to "service_role";

grant update on table "public"."routine_completions" to "service_role";

grant delete on table "public"."routines" to "anon";

grant insert on table "public"."routines" to "anon";

grant references on table "public"."routines" to "anon";

grant select on table "public"."routines" to "anon";

grant trigger on table "public"."routines" to "anon";

grant truncate on table "public"."routines" to "anon";

grant update on table "public"."routines" to "anon";

grant delete on table "public"."routines" to "authenticated";

grant insert on table "public"."routines" to "authenticated";

grant references on table "public"."routines" to "authenticated";

grant select on table "public"."routines" to "authenticated";

grant trigger on table "public"."routines" to "authenticated";

grant truncate on table "public"."routines" to "authenticated";

grant update on table "public"."routines" to "authenticated";

grant delete on table "public"."routines" to "service_role";

grant insert on table "public"."routines" to "service_role";

grant references on table "public"."routines" to "service_role";

grant select on table "public"."routines" to "service_role";

grant trigger on table "public"."routines" to "service_role";

grant truncate on table "public"."routines" to "service_role";

grant update on table "public"."routines" to "service_role";

grant delete on table "public"."schedules" to "anon";

grant insert on table "public"."schedules" to "anon";

grant references on table "public"."schedules" to "anon";

grant select on table "public"."schedules" to "anon";

grant trigger on table "public"."schedules" to "anon";

grant truncate on table "public"."schedules" to "anon";

grant update on table "public"."schedules" to "anon";

grant delete on table "public"."schedules" to "authenticated";

grant insert on table "public"."schedules" to "authenticated";

grant references on table "public"."schedules" to "authenticated";

grant select on table "public"."schedules" to "authenticated";

grant trigger on table "public"."schedules" to "authenticated";

grant truncate on table "public"."schedules" to "authenticated";

grant update on table "public"."schedules" to "authenticated";

grant delete on table "public"."schedules" to "service_role";

grant insert on table "public"."schedules" to "service_role";

grant references on table "public"."schedules" to "service_role";

grant select on table "public"."schedules" to "service_role";

grant trigger on table "public"."schedules" to "service_role";

grant truncate on table "public"."schedules" to "service_role";

grant update on table "public"."schedules" to "service_role";

grant delete on table "public"."semesters" to "anon";

grant insert on table "public"."semesters" to "anon";

grant references on table "public"."semesters" to "anon";

grant select on table "public"."semesters" to "anon";

grant trigger on table "public"."semesters" to "anon";

grant truncate on table "public"."semesters" to "anon";

grant update on table "public"."semesters" to "anon";

grant delete on table "public"."semesters" to "authenticated";

grant insert on table "public"."semesters" to "authenticated";

grant references on table "public"."semesters" to "authenticated";

grant select on table "public"."semesters" to "authenticated";

grant trigger on table "public"."semesters" to "authenticated";

grant truncate on table "public"."semesters" to "authenticated";

grant update on table "public"."semesters" to "authenticated";

grant delete on table "public"."semesters" to "service_role";

grant insert on table "public"."semesters" to "service_role";

grant references on table "public"."semesters" to "service_role";

grant select on table "public"."semesters" to "service_role";

grant trigger on table "public"."semesters" to "service_role";

grant truncate on table "public"."semesters" to "service_role";

grant update on table "public"."semesters" to "service_role";

grant delete on table "public"."sleep_data" to "anon";

grant insert on table "public"."sleep_data" to "anon";

grant references on table "public"."sleep_data" to "anon";

grant select on table "public"."sleep_data" to "anon";

grant trigger on table "public"."sleep_data" to "anon";

grant truncate on table "public"."sleep_data" to "anon";

grant update on table "public"."sleep_data" to "anon";

grant delete on table "public"."sleep_data" to "authenticated";

grant insert on table "public"."sleep_data" to "authenticated";

grant references on table "public"."sleep_data" to "authenticated";

grant select on table "public"."sleep_data" to "authenticated";

grant trigger on table "public"."sleep_data" to "authenticated";

grant truncate on table "public"."sleep_data" to "authenticated";

grant update on table "public"."sleep_data" to "authenticated";

grant delete on table "public"."sleep_data" to "service_role";

grant insert on table "public"."sleep_data" to "service_role";

grant references on table "public"."sleep_data" to "service_role";

grant select on table "public"."sleep_data" to "service_role";

grant trigger on table "public"."sleep_data" to "service_role";

grant truncate on table "public"."sleep_data" to "service_role";

grant update on table "public"."sleep_data" to "service_role";

grant delete on table "public"."sleep_data_tags" to "anon";

grant insert on table "public"."sleep_data_tags" to "anon";

grant references on table "public"."sleep_data_tags" to "anon";

grant select on table "public"."sleep_data_tags" to "anon";

grant trigger on table "public"."sleep_data_tags" to "anon";

grant truncate on table "public"."sleep_data_tags" to "anon";

grant update on table "public"."sleep_data_tags" to "anon";

grant delete on table "public"."sleep_data_tags" to "authenticated";

grant insert on table "public"."sleep_data_tags" to "authenticated";

grant references on table "public"."sleep_data_tags" to "authenticated";

grant select on table "public"."sleep_data_tags" to "authenticated";

grant trigger on table "public"."sleep_data_tags" to "authenticated";

grant truncate on table "public"."sleep_data_tags" to "authenticated";

grant update on table "public"."sleep_data_tags" to "authenticated";

grant delete on table "public"."sleep_data_tags" to "service_role";

grant insert on table "public"."sleep_data_tags" to "service_role";

grant references on table "public"."sleep_data_tags" to "service_role";

grant select on table "public"."sleep_data_tags" to "service_role";

grant trigger on table "public"."sleep_data_tags" to "service_role";

grant truncate on table "public"."sleep_data_tags" to "service_role";

grant update on table "public"."sleep_data_tags" to "service_role";

grant delete on table "public"."sleep_goals" to "anon";

grant insert on table "public"."sleep_goals" to "anon";

grant references on table "public"."sleep_goals" to "anon";

grant select on table "public"."sleep_goals" to "anon";

grant trigger on table "public"."sleep_goals" to "anon";

grant truncate on table "public"."sleep_goals" to "anon";

grant update on table "public"."sleep_goals" to "anon";

grant delete on table "public"."sleep_goals" to "authenticated";

grant insert on table "public"."sleep_goals" to "authenticated";

grant references on table "public"."sleep_goals" to "authenticated";

grant select on table "public"."sleep_goals" to "authenticated";

grant trigger on table "public"."sleep_goals" to "authenticated";

grant truncate on table "public"."sleep_goals" to "authenticated";

grant update on table "public"."sleep_goals" to "authenticated";

grant delete on table "public"."sleep_goals" to "service_role";

grant insert on table "public"."sleep_goals" to "service_role";

grant references on table "public"."sleep_goals" to "service_role";

grant select on table "public"."sleep_goals" to "service_role";

grant trigger on table "public"."sleep_goals" to "service_role";

grant truncate on table "public"."sleep_goals" to "service_role";

grant update on table "public"."sleep_goals" to "service_role";

grant delete on table "public"."sleep_insights" to "anon";

grant insert on table "public"."sleep_insights" to "anon";

grant references on table "public"."sleep_insights" to "anon";

grant select on table "public"."sleep_insights" to "anon";

grant trigger on table "public"."sleep_insights" to "anon";

grant truncate on table "public"."sleep_insights" to "anon";

grant update on table "public"."sleep_insights" to "anon";

grant delete on table "public"."sleep_insights" to "authenticated";

grant insert on table "public"."sleep_insights" to "authenticated";

grant references on table "public"."sleep_insights" to "authenticated";

grant select on table "public"."sleep_insights" to "authenticated";

grant trigger on table "public"."sleep_insights" to "authenticated";

grant truncate on table "public"."sleep_insights" to "authenticated";

grant update on table "public"."sleep_insights" to "authenticated";

grant delete on table "public"."sleep_insights" to "service_role";

grant insert on table "public"."sleep_insights" to "service_role";

grant references on table "public"."sleep_insights" to "service_role";

grant select on table "public"."sleep_insights" to "service_role";

grant trigger on table "public"."sleep_insights" to "service_role";

grant truncate on table "public"."sleep_insights" to "service_role";

grant update on table "public"."sleep_insights" to "service_role";

grant delete on table "public"."sleep_tags" to "anon";

grant insert on table "public"."sleep_tags" to "anon";

grant references on table "public"."sleep_tags" to "anon";

grant select on table "public"."sleep_tags" to "anon";

grant trigger on table "public"."sleep_tags" to "anon";

grant truncate on table "public"."sleep_tags" to "anon";

grant update on table "public"."sleep_tags" to "anon";

grant delete on table "public"."sleep_tags" to "authenticated";

grant insert on table "public"."sleep_tags" to "authenticated";

grant references on table "public"."sleep_tags" to "authenticated";

grant select on table "public"."sleep_tags" to "authenticated";

grant trigger on table "public"."sleep_tags" to "authenticated";

grant truncate on table "public"."sleep_tags" to "authenticated";

grant update on table "public"."sleep_tags" to "authenticated";

grant delete on table "public"."sleep_tags" to "service_role";

grant insert on table "public"."sleep_tags" to "service_role";

grant references on table "public"."sleep_tags" to "service_role";

grant select on table "public"."sleep_tags" to "service_role";

grant trigger on table "public"."sleep_tags" to "service_role";

grant truncate on table "public"."sleep_tags" to "service_role";

grant update on table "public"."sleep_tags" to "service_role";

grant delete on table "public"."streaks" to "anon";

grant insert on table "public"."streaks" to "anon";

grant references on table "public"."streaks" to "anon";

grant select on table "public"."streaks" to "anon";

grant trigger on table "public"."streaks" to "anon";

grant truncate on table "public"."streaks" to "anon";

grant update on table "public"."streaks" to "anon";

grant delete on table "public"."streaks" to "authenticated";

grant insert on table "public"."streaks" to "authenticated";

grant references on table "public"."streaks" to "authenticated";

grant select on table "public"."streaks" to "authenticated";

grant trigger on table "public"."streaks" to "authenticated";

grant truncate on table "public"."streaks" to "authenticated";

grant update on table "public"."streaks" to "authenticated";

grant delete on table "public"."streaks" to "service_role";

grant insert on table "public"."streaks" to "service_role";

grant references on table "public"."streaks" to "service_role";

grant select on table "public"."streaks" to "service_role";

grant trigger on table "public"."streaks" to "service_role";

grant truncate on table "public"."streaks" to "service_role";

grant update on table "public"."streaks" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."therapist_availability_exceptions" to "anon";

grant insert on table "public"."therapist_availability_exceptions" to "anon";

grant references on table "public"."therapist_availability_exceptions" to "anon";

grant select on table "public"."therapist_availability_exceptions" to "anon";

grant trigger on table "public"."therapist_availability_exceptions" to "anon";

grant truncate on table "public"."therapist_availability_exceptions" to "anon";

grant update on table "public"."therapist_availability_exceptions" to "anon";

grant delete on table "public"."therapist_availability_exceptions" to "authenticated";

grant insert on table "public"."therapist_availability_exceptions" to "authenticated";

grant references on table "public"."therapist_availability_exceptions" to "authenticated";

grant select on table "public"."therapist_availability_exceptions" to "authenticated";

grant trigger on table "public"."therapist_availability_exceptions" to "authenticated";

grant truncate on table "public"."therapist_availability_exceptions" to "authenticated";

grant update on table "public"."therapist_availability_exceptions" to "authenticated";

grant delete on table "public"."therapist_availability_exceptions" to "service_role";

grant insert on table "public"."therapist_availability_exceptions" to "service_role";

grant references on table "public"."therapist_availability_exceptions" to "service_role";

grant select on table "public"."therapist_availability_exceptions" to "service_role";

grant trigger on table "public"."therapist_availability_exceptions" to "service_role";

grant truncate on table "public"."therapist_availability_exceptions" to "service_role";

grant update on table "public"."therapist_availability_exceptions" to "service_role";

grant delete on table "public"."therapist_profiles" to "anon";

grant insert on table "public"."therapist_profiles" to "anon";

grant references on table "public"."therapist_profiles" to "anon";

grant select on table "public"."therapist_profiles" to "anon";

grant trigger on table "public"."therapist_profiles" to "anon";

grant truncate on table "public"."therapist_profiles" to "anon";

grant update on table "public"."therapist_profiles" to "anon";

grant delete on table "public"."therapist_profiles" to "authenticated";

grant insert on table "public"."therapist_profiles" to "authenticated";

grant references on table "public"."therapist_profiles" to "authenticated";

grant select on table "public"."therapist_profiles" to "authenticated";

grant trigger on table "public"."therapist_profiles" to "authenticated";

grant truncate on table "public"."therapist_profiles" to "authenticated";

grant update on table "public"."therapist_profiles" to "authenticated";

grant delete on table "public"."therapist_profiles" to "service_role";

grant insert on table "public"."therapist_profiles" to "service_role";

grant references on table "public"."therapist_profiles" to "service_role";

grant select on table "public"."therapist_profiles" to "service_role";

grant trigger on table "public"."therapist_profiles" to "service_role";

grant truncate on table "public"."therapist_profiles" to "service_role";

grant update on table "public"."therapist_profiles" to "service_role";

grant delete on table "public"."therapist_reviews" to "anon";

grant insert on table "public"."therapist_reviews" to "anon";

grant references on table "public"."therapist_reviews" to "anon";

grant select on table "public"."therapist_reviews" to "anon";

grant trigger on table "public"."therapist_reviews" to "anon";

grant truncate on table "public"."therapist_reviews" to "anon";

grant update on table "public"."therapist_reviews" to "anon";

grant delete on table "public"."therapist_reviews" to "authenticated";

grant insert on table "public"."therapist_reviews" to "authenticated";

grant references on table "public"."therapist_reviews" to "authenticated";

grant select on table "public"."therapist_reviews" to "authenticated";

grant trigger on table "public"."therapist_reviews" to "authenticated";

grant truncate on table "public"."therapist_reviews" to "authenticated";

grant update on table "public"."therapist_reviews" to "authenticated";

grant delete on table "public"."therapist_reviews" to "service_role";

grant insert on table "public"."therapist_reviews" to "service_role";

grant references on table "public"."therapist_reviews" to "service_role";

grant select on table "public"."therapist_reviews" to "service_role";

grant trigger on table "public"."therapist_reviews" to "service_role";

grant truncate on table "public"."therapist_reviews" to "service_role";

grant update on table "public"."therapist_reviews" to "service_role";

grant delete on table "public"."user_goals" to "anon";

grant insert on table "public"."user_goals" to "anon";

grant references on table "public"."user_goals" to "anon";

grant select on table "public"."user_goals" to "anon";

grant trigger on table "public"."user_goals" to "anon";

grant truncate on table "public"."user_goals" to "anon";

grant update on table "public"."user_goals" to "anon";

grant delete on table "public"."user_goals" to "authenticated";

grant insert on table "public"."user_goals" to "authenticated";

grant references on table "public"."user_goals" to "authenticated";

grant select on table "public"."user_goals" to "authenticated";

grant trigger on table "public"."user_goals" to "authenticated";

grant truncate on table "public"."user_goals" to "authenticated";

grant update on table "public"."user_goals" to "authenticated";

grant delete on table "public"."user_goals" to "service_role";

grant insert on table "public"."user_goals" to "service_role";

grant references on table "public"."user_goals" to "service_role";

grant select on table "public"."user_goals" to "service_role";

grant trigger on table "public"."user_goals" to "service_role";

grant truncate on table "public"."user_goals" to "service_role";

grant update on table "public"."user_goals" to "service_role";

grant delete on table "public"."user_interests" to "anon";

grant insert on table "public"."user_interests" to "anon";

grant references on table "public"."user_interests" to "anon";

grant select on table "public"."user_interests" to "anon";

grant trigger on table "public"."user_interests" to "anon";

grant truncate on table "public"."user_interests" to "anon";

grant update on table "public"."user_interests" to "anon";

grant delete on table "public"."user_interests" to "authenticated";

grant insert on table "public"."user_interests" to "authenticated";

grant references on table "public"."user_interests" to "authenticated";

grant select on table "public"."user_interests" to "authenticated";

grant trigger on table "public"."user_interests" to "authenticated";

grant truncate on table "public"."user_interests" to "authenticated";

grant update on table "public"."user_interests" to "authenticated";

grant delete on table "public"."user_interests" to "service_role";

grant insert on table "public"."user_interests" to "service_role";

grant references on table "public"."user_interests" to "service_role";

grant select on table "public"."user_interests" to "service_role";

grant trigger on table "public"."user_interests" to "service_role";

grant truncate on table "public"."user_interests" to "service_role";

grant update on table "public"."user_interests" to "service_role";

grant delete on table "public"."user_post_preferences" to "anon";

grant insert on table "public"."user_post_preferences" to "anon";

grant references on table "public"."user_post_preferences" to "anon";

grant select on table "public"."user_post_preferences" to "anon";

grant trigger on table "public"."user_post_preferences" to "anon";

grant truncate on table "public"."user_post_preferences" to "anon";

grant update on table "public"."user_post_preferences" to "anon";

grant delete on table "public"."user_post_preferences" to "authenticated";

grant insert on table "public"."user_post_preferences" to "authenticated";

grant references on table "public"."user_post_preferences" to "authenticated";

grant select on table "public"."user_post_preferences" to "authenticated";

grant trigger on table "public"."user_post_preferences" to "authenticated";

grant truncate on table "public"."user_post_preferences" to "authenticated";

grant update on table "public"."user_post_preferences" to "authenticated";

grant delete on table "public"."user_post_preferences" to "service_role";

grant insert on table "public"."user_post_preferences" to "service_role";

grant references on table "public"."user_post_preferences" to "service_role";

grant select on table "public"."user_post_preferences" to "service_role";

grant trigger on table "public"."user_post_preferences" to "service_role";

grant truncate on table "public"."user_post_preferences" to "service_role";

grant update on table "public"."user_post_preferences" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."user_recommendations" to "anon";

grant insert on table "public"."user_recommendations" to "anon";

grant references on table "public"."user_recommendations" to "anon";

grant select on table "public"."user_recommendations" to "anon";

grant trigger on table "public"."user_recommendations" to "anon";

grant truncate on table "public"."user_recommendations" to "anon";

grant update on table "public"."user_recommendations" to "anon";

grant delete on table "public"."user_recommendations" to "authenticated";

grant insert on table "public"."user_recommendations" to "authenticated";

grant references on table "public"."user_recommendations" to "authenticated";

grant select on table "public"."user_recommendations" to "authenticated";

grant trigger on table "public"."user_recommendations" to "authenticated";

grant truncate on table "public"."user_recommendations" to "authenticated";

grant update on table "public"."user_recommendations" to "authenticated";

grant delete on table "public"."user_recommendations" to "service_role";

grant insert on table "public"."user_recommendations" to "service_role";

grant references on table "public"."user_recommendations" to "service_role";

grant select on table "public"."user_recommendations" to "service_role";

grant trigger on table "public"."user_recommendations" to "service_role";

grant truncate on table "public"."user_recommendations" to "service_role";

grant update on table "public"."user_recommendations" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."user_saved_resources" to "anon";

grant insert on table "public"."user_saved_resources" to "anon";

grant references on table "public"."user_saved_resources" to "anon";

grant select on table "public"."user_saved_resources" to "anon";

grant trigger on table "public"."user_saved_resources" to "anon";

grant truncate on table "public"."user_saved_resources" to "anon";

grant update on table "public"."user_saved_resources" to "anon";

grant delete on table "public"."user_saved_resources" to "authenticated";

grant insert on table "public"."user_saved_resources" to "authenticated";

grant references on table "public"."user_saved_resources" to "authenticated";

grant select on table "public"."user_saved_resources" to "authenticated";

grant trigger on table "public"."user_saved_resources" to "authenticated";

grant truncate on table "public"."user_saved_resources" to "authenticated";

grant update on table "public"."user_saved_resources" to "authenticated";

grant delete on table "public"."user_saved_resources" to "service_role";

grant insert on table "public"."user_saved_resources" to "service_role";

grant references on table "public"."user_saved_resources" to "service_role";

grant select on table "public"."user_saved_resources" to "service_role";

grant trigger on table "public"."user_saved_resources" to "service_role";

grant truncate on table "public"."user_saved_resources" to "service_role";

grant update on table "public"."user_saved_resources" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."wellness_plans" to "anon";

grant insert on table "public"."wellness_plans" to "anon";

grant references on table "public"."wellness_plans" to "anon";

grant select on table "public"."wellness_plans" to "anon";

grant trigger on table "public"."wellness_plans" to "anon";

grant truncate on table "public"."wellness_plans" to "anon";

grant update on table "public"."wellness_plans" to "anon";

grant delete on table "public"."wellness_plans" to "authenticated";

grant insert on table "public"."wellness_plans" to "authenticated";

grant references on table "public"."wellness_plans" to "authenticated";

grant select on table "public"."wellness_plans" to "authenticated";

grant trigger on table "public"."wellness_plans" to "authenticated";

grant truncate on table "public"."wellness_plans" to "authenticated";

grant update on table "public"."wellness_plans" to "authenticated";

grant delete on table "public"."wellness_plans" to "service_role";

grant insert on table "public"."wellness_plans" to "service_role";

grant references on table "public"."wellness_plans" to "service_role";

grant select on table "public"."wellness_plans" to "service_role";

grant trigger on table "public"."wellness_plans" to "service_role";

grant truncate on table "public"."wellness_plans" to "service_role";

grant update on table "public"."wellness_plans" to "service_role";

create policy "Clients can insert appointments"
on "public"."appointments"
as permissive
for insert
to public
with check ((auth.uid() = client_id));


create policy "Therapists can update own appointments"
on "public"."appointments"
as permissive
for update
to public
using ((auth.uid() = therapist_id));


create policy "Users can update own appointments"
on "public"."appointments"
as permissive
for update
to public
using ((auth.uid() = client_id));


create policy "Users can view own appointments"
on "public"."appointments"
as permissive
for select
to public
using (((auth.uid() = client_id) OR (auth.uid() = therapist_id)));


create policy "Enable delete for users based on user_id"
on "public"."post_likes"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Enable insert for authenticated users only"
on "public"."post_likes"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."post_likes"
as permissive
for select
to public
using (true);


create policy "Enable delete for users based on user_id"
on "public"."post_replies"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Enable insert for authenticated users only"
on "public"."post_replies"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."post_replies"
as permissive
for select
to public
using (true);


create policy "Users can delete their own routines"
on "public"."routines"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own routines"
on "public"."routines"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own routines"
on "public"."routines"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own routines"
on "public"."routines"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "semesters_user_policy"
on "public"."semesters"
as permissive
for all
to authenticated
using ((user_id = auth.uid()));


create policy "Users can delete their own sleep data"
on "public"."sleep_data"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own sleep data"
on "public"."sleep_data"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own sleep data"
on "public"."sleep_data"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own sleep data"
on "public"."sleep_data"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete their own sleep goals"
on "public"."sleep_goals"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own sleep goals"
on "public"."sleep_goals"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own sleep goals"
on "public"."sleep_goals"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own sleep goals"
on "public"."sleep_goals"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view their own sleep insights"
on "public"."sleep_insights"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Therapists can manage own availability exceptions"
on "public"."therapist_availability_exceptions"
as permissive
for all
to public
using ((auth.uid() = therapist_id));


create policy "Therapist profiles are publicly readable"
on "public"."therapist_profiles"
as permissive
for select
to public
using (true);


create policy "Therapists can update own profile"
on "public"."therapist_profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Clients can insert reviews for own appointments"
on "public"."therapist_reviews"
as permissive
for insert
to public
with check (((auth.uid() = client_id) AND (EXISTS ( SELECT 1
   FROM appointments
  WHERE ((appointments.id = therapist_reviews.appointment_id) AND (appointments.client_id = auth.uid()) AND (appointments.status = 'completed'::text))))));


create policy "Reviews are publicly readable"
on "public"."therapist_reviews"
as permissive
for select
to public
using (true);


create policy "Users can view their own interests"
on "public"."user_interests"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can view their own recommendations"
on "public"."user_recommendations"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can manage their own saved resources"
on "public"."user_saved_resources"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Admin can view all users"
on "public"."users"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.id = auth.uid()) AND ((users_1.role)::text = 'admin'::text)))));


create policy "Users can update own data"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view own data"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Students access their wellness plans"
on "public"."wellness_plans"
as permissive
for all
to public
using (((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role_id = ( SELECT roles.id
           FROM roles
          WHERE (roles.name = 'student'::text)))))) AND (user_id = auth.uid())));


CREATE TRIGGER after_checkin_insert AFTER INSERT ON public.check_ins FOR EACH ROW EXECUTE FUNCTION update_streak_counts();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER check_routine_completion_date BEFORE INSERT OR UPDATE ON public.routine_completions FOR EACH ROW EXECUTE FUNCTION can_complete_routine();

CREATE TRIGGER update_progress_on_routine_completion AFTER INSERT OR UPDATE ON public.routine_completions FOR EACH ROW EXECUTE FUNCTION update_progress_archive();

CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_sleep_progress AFTER INSERT OR UPDATE ON public.sleep_data FOR EACH ROW EXECUTE FUNCTION sync_sleep_with_progress();

CREATE TRIGGER update_sleep_data_timestamp BEFORE UPDATE ON public.sleep_data FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sleep_goals_timestamp BEFORE UPDATE ON public.sleep_goals FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_streak_length_trigger BEFORE UPDATE ON public.streaks FOR EACH ROW EXECUTE FUNCTION update_streak_length();

CREATE TRIGGER on_user_interests_change AFTER INSERT OR DELETE OR UPDATE ON public.user_interests FOR EACH ROW EXECUTE FUNCTION trigger_generate_recommendations();


