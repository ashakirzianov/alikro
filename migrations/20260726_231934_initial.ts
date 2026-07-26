import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_artworks_medium" AS ENUM('painting', 'drawing', 'ceramic', 'illustration', 'poster', 'collage', 'tattoo');
  CREATE TYPE "public"."enum_artworks_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__artworks_v_version_medium" AS ENUM('painting', 'drawing', 'ceramic', 'illustration', 'poster', 'collage', 'tattoo');
  CREATE TYPE "public"."enum__artworks_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "artworks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"title" varchar,
  	"year" numeric,
  	"material" varchar,
  	"medium" "enum_artworks_medium",
  	"show_on_site" boolean DEFAULT true,
  	"favorite" boolean DEFAULT false,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_artworks_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_w320_url" varchar,
  	"sizes_w320_width" numeric,
  	"sizes_w320_height" numeric,
  	"sizes_w320_mime_type" varchar,
  	"sizes_w320_filesize" numeric,
  	"sizes_w320_filename" varchar,
  	"sizes_w480_url" varchar,
  	"sizes_w480_width" numeric,
  	"sizes_w480_height" numeric,
  	"sizes_w480_mime_type" varchar,
  	"sizes_w480_filesize" numeric,
  	"sizes_w480_filename" varchar,
  	"sizes_w640_url" varchar,
  	"sizes_w640_width" numeric,
  	"sizes_w640_height" numeric,
  	"sizes_w640_mime_type" varchar,
  	"sizes_w640_filesize" numeric,
  	"sizes_w640_filename" varchar,
  	"sizes_w768_url" varchar,
  	"sizes_w768_width" numeric,
  	"sizes_w768_height" numeric,
  	"sizes_w768_mime_type" varchar,
  	"sizes_w768_filesize" numeric,
  	"sizes_w768_filename" varchar,
  	"sizes_w960_url" varchar,
  	"sizes_w960_width" numeric,
  	"sizes_w960_height" numeric,
  	"sizes_w960_mime_type" varchar,
  	"sizes_w960_filesize" numeric,
  	"sizes_w960_filename" varchar,
  	"sizes_w1200_url" varchar,
  	"sizes_w1200_width" numeric,
  	"sizes_w1200_height" numeric,
  	"sizes_w1200_mime_type" varchar,
  	"sizes_w1200_filesize" numeric,
  	"sizes_w1200_filename" varchar,
  	"sizes_w1600_url" varchar,
  	"sizes_w1600_width" numeric,
  	"sizes_w1600_height" numeric,
  	"sizes_w1600_mime_type" varchar,
  	"sizes_w1600_filesize" numeric,
  	"sizes_w1600_filename" varchar,
  	"sizes_w1920_url" varchar,
  	"sizes_w1920_width" numeric,
  	"sizes_w1920_height" numeric,
  	"sizes_w1920_mime_type" varchar,
  	"sizes_w1920_filesize" numeric,
  	"sizes_w1920_filename" varchar
  );
  
  CREATE TABLE "artworks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"materials_id" integer,
  	"series_id" integer
  );
  
  CREATE TABLE "_artworks_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_year" numeric,
  	"version_material" varchar,
  	"version_medium" "enum__artworks_v_version_medium",
  	"version_show_on_site" boolean DEFAULT true,
  	"version_favorite" boolean DEFAULT false,
  	"version_order" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__artworks_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"version_sizes_w320_url" varchar,
  	"version_sizes_w320_width" numeric,
  	"version_sizes_w320_height" numeric,
  	"version_sizes_w320_mime_type" varchar,
  	"version_sizes_w320_filesize" numeric,
  	"version_sizes_w320_filename" varchar,
  	"version_sizes_w480_url" varchar,
  	"version_sizes_w480_width" numeric,
  	"version_sizes_w480_height" numeric,
  	"version_sizes_w480_mime_type" varchar,
  	"version_sizes_w480_filesize" numeric,
  	"version_sizes_w480_filename" varchar,
  	"version_sizes_w640_url" varchar,
  	"version_sizes_w640_width" numeric,
  	"version_sizes_w640_height" numeric,
  	"version_sizes_w640_mime_type" varchar,
  	"version_sizes_w640_filesize" numeric,
  	"version_sizes_w640_filename" varchar,
  	"version_sizes_w768_url" varchar,
  	"version_sizes_w768_width" numeric,
  	"version_sizes_w768_height" numeric,
  	"version_sizes_w768_mime_type" varchar,
  	"version_sizes_w768_filesize" numeric,
  	"version_sizes_w768_filename" varchar,
  	"version_sizes_w960_url" varchar,
  	"version_sizes_w960_width" numeric,
  	"version_sizes_w960_height" numeric,
  	"version_sizes_w960_mime_type" varchar,
  	"version_sizes_w960_filesize" numeric,
  	"version_sizes_w960_filename" varchar,
  	"version_sizes_w1200_url" varchar,
  	"version_sizes_w1200_width" numeric,
  	"version_sizes_w1200_height" numeric,
  	"version_sizes_w1200_mime_type" varchar,
  	"version_sizes_w1200_filesize" numeric,
  	"version_sizes_w1200_filename" varchar,
  	"version_sizes_w1600_url" varchar,
  	"version_sizes_w1600_width" numeric,
  	"version_sizes_w1600_height" numeric,
  	"version_sizes_w1600_mime_type" varchar,
  	"version_sizes_w1600_filesize" numeric,
  	"version_sizes_w1600_filename" varchar,
  	"version_sizes_w1920_url" varchar,
  	"version_sizes_w1920_width" numeric,
  	"version_sizes_w1920_height" numeric,
  	"version_sizes_w1920_mime_type" varchar,
  	"version_sizes_w1920_filesize" numeric,
  	"version_sizes_w1920_filename" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_artworks_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"materials_id" integer,
  	"series_id" integer
  );
  
  CREATE TABLE "series" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"cover_id" integer,
  	"featured" boolean DEFAULT false,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "materials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"broader_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"artworks_id" integer,
  	"series_id" integer,
  	"materials_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artworks_v" ADD CONSTRAINT "_artworks_v_parent_id_artworks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artworks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_artworks_v_rels" ADD CONSTRAINT "_artworks_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_artworks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artworks_v_rels" ADD CONSTRAINT "_artworks_v_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artworks_v_rels" ADD CONSTRAINT "_artworks_v_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "series" ADD CONSTRAINT "series_cover_id_artworks_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."artworks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials" ADD CONSTRAINT "materials_broader_id_materials_id_fk" FOREIGN KEY ("broader_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "artworks_slug_idx" ON "artworks" USING btree ("slug");
  CREATE INDEX "artworks_title_idx" ON "artworks" USING btree ("title");
  CREATE INDEX "artworks_year_idx" ON "artworks" USING btree ("year");
  CREATE INDEX "artworks_medium_idx" ON "artworks" USING btree ("medium");
  CREATE INDEX "artworks_show_on_site_idx" ON "artworks" USING btree ("show_on_site");
  CREATE INDEX "artworks_favorite_idx" ON "artworks" USING btree ("favorite");
  CREATE INDEX "artworks_order_idx" ON "artworks" USING btree ("order");
  CREATE INDEX "artworks_updated_at_idx" ON "artworks" USING btree ("updated_at");
  CREATE INDEX "artworks_created_at_idx" ON "artworks" USING btree ("created_at");
  CREATE INDEX "artworks__status_idx" ON "artworks" USING btree ("_status");
  CREATE UNIQUE INDEX "artworks_filename_idx" ON "artworks" USING btree ("filename");
  CREATE INDEX "artworks_sizes_w320_sizes_w320_filename_idx" ON "artworks" USING btree ("sizes_w320_filename");
  CREATE INDEX "artworks_sizes_w480_sizes_w480_filename_idx" ON "artworks" USING btree ("sizes_w480_filename");
  CREATE INDEX "artworks_sizes_w640_sizes_w640_filename_idx" ON "artworks" USING btree ("sizes_w640_filename");
  CREATE INDEX "artworks_sizes_w768_sizes_w768_filename_idx" ON "artworks" USING btree ("sizes_w768_filename");
  CREATE INDEX "artworks_sizes_w960_sizes_w960_filename_idx" ON "artworks" USING btree ("sizes_w960_filename");
  CREATE INDEX "artworks_sizes_w1200_sizes_w1200_filename_idx" ON "artworks" USING btree ("sizes_w1200_filename");
  CREATE INDEX "artworks_sizes_w1600_sizes_w1600_filename_idx" ON "artworks" USING btree ("sizes_w1600_filename");
  CREATE INDEX "artworks_sizes_w1920_sizes_w1920_filename_idx" ON "artworks" USING btree ("sizes_w1920_filename");
  CREATE INDEX "artworks_rels_order_idx" ON "artworks_rels" USING btree ("order");
  CREATE INDEX "artworks_rels_parent_idx" ON "artworks_rels" USING btree ("parent_id");
  CREATE INDEX "artworks_rels_path_idx" ON "artworks_rels" USING btree ("path");
  CREATE INDEX "artworks_rels_materials_id_idx" ON "artworks_rels" USING btree ("materials_id");
  CREATE INDEX "artworks_rels_series_id_idx" ON "artworks_rels" USING btree ("series_id");
  CREATE INDEX "_artworks_v_parent_idx" ON "_artworks_v" USING btree ("parent_id");
  CREATE INDEX "_artworks_v_version_version_slug_idx" ON "_artworks_v" USING btree ("version_slug");
  CREATE INDEX "_artworks_v_version_version_title_idx" ON "_artworks_v" USING btree ("version_title");
  CREATE INDEX "_artworks_v_version_version_year_idx" ON "_artworks_v" USING btree ("version_year");
  CREATE INDEX "_artworks_v_version_version_medium_idx" ON "_artworks_v" USING btree ("version_medium");
  CREATE INDEX "_artworks_v_version_version_show_on_site_idx" ON "_artworks_v" USING btree ("version_show_on_site");
  CREATE INDEX "_artworks_v_version_version_favorite_idx" ON "_artworks_v" USING btree ("version_favorite");
  CREATE INDEX "_artworks_v_version_version_order_idx" ON "_artworks_v" USING btree ("version_order");
  CREATE INDEX "_artworks_v_version_version_updated_at_idx" ON "_artworks_v" USING btree ("version_updated_at");
  CREATE INDEX "_artworks_v_version_version_created_at_idx" ON "_artworks_v" USING btree ("version_created_at");
  CREATE INDEX "_artworks_v_version_version__status_idx" ON "_artworks_v" USING btree ("version__status");
  CREATE INDEX "_artworks_v_version_version_filename_idx" ON "_artworks_v" USING btree ("version_filename");
  CREATE INDEX "_artworks_v_version_sizes_w320_version_sizes_w320_filena_idx" ON "_artworks_v" USING btree ("version_sizes_w320_filename");
  CREATE INDEX "_artworks_v_version_sizes_w480_version_sizes_w480_filena_idx" ON "_artworks_v" USING btree ("version_sizes_w480_filename");
  CREATE INDEX "_artworks_v_version_sizes_w640_version_sizes_w640_filena_idx" ON "_artworks_v" USING btree ("version_sizes_w640_filename");
  CREATE INDEX "_artworks_v_version_sizes_w768_version_sizes_w768_filena_idx" ON "_artworks_v" USING btree ("version_sizes_w768_filename");
  CREATE INDEX "_artworks_v_version_sizes_w960_version_sizes_w960_filena_idx" ON "_artworks_v" USING btree ("version_sizes_w960_filename");
  CREATE INDEX "_artworks_v_version_sizes_w1200_version_sizes_w1200_file_idx" ON "_artworks_v" USING btree ("version_sizes_w1200_filename");
  CREATE INDEX "_artworks_v_version_sizes_w1600_version_sizes_w1600_file_idx" ON "_artworks_v" USING btree ("version_sizes_w1600_filename");
  CREATE INDEX "_artworks_v_version_sizes_w1920_version_sizes_w1920_file_idx" ON "_artworks_v" USING btree ("version_sizes_w1920_filename");
  CREATE INDEX "_artworks_v_created_at_idx" ON "_artworks_v" USING btree ("created_at");
  CREATE INDEX "_artworks_v_updated_at_idx" ON "_artworks_v" USING btree ("updated_at");
  CREATE INDEX "_artworks_v_latest_idx" ON "_artworks_v" USING btree ("latest");
  CREATE INDEX "_artworks_v_rels_order_idx" ON "_artworks_v_rels" USING btree ("order");
  CREATE INDEX "_artworks_v_rels_parent_idx" ON "_artworks_v_rels" USING btree ("parent_id");
  CREATE INDEX "_artworks_v_rels_path_idx" ON "_artworks_v_rels" USING btree ("path");
  CREATE INDEX "_artworks_v_rels_materials_id_idx" ON "_artworks_v_rels" USING btree ("materials_id");
  CREATE INDEX "_artworks_v_rels_series_id_idx" ON "_artworks_v_rels" USING btree ("series_id");
  CREATE UNIQUE INDEX "series_slug_idx" ON "series" USING btree ("slug");
  CREATE INDEX "series_cover_idx" ON "series" USING btree ("cover_id");
  CREATE INDEX "series_updated_at_idx" ON "series" USING btree ("updated_at");
  CREATE INDEX "series_created_at_idx" ON "series" USING btree ("created_at");
  CREATE UNIQUE INDEX "materials_slug_idx" ON "materials" USING btree ("slug");
  CREATE INDEX "materials_broader_idx" ON "materials" USING btree ("broader_id");
  CREATE INDEX "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
  CREATE INDEX "materials_created_at_idx" ON "materials" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_artworks_id_idx" ON "payload_locked_documents_rels" USING btree ("artworks_id");
  CREATE INDEX "payload_locked_documents_rels_series_id_idx" ON "payload_locked_documents_rels" USING btree ("series_id");
  CREATE INDEX "payload_locked_documents_rels_materials_id_idx" ON "payload_locked_documents_rels" USING btree ("materials_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "artworks" CASCADE;
  DROP TABLE "artworks_rels" CASCADE;
  DROP TABLE "_artworks_v" CASCADE;
  DROP TABLE "_artworks_v_rels" CASCADE;
  DROP TABLE "series" CASCADE;
  DROP TABLE "materials" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_artworks_medium";
  DROP TYPE "public"."enum_artworks_status";
  DROP TYPE "public"."enum__artworks_v_version_medium";
  DROP TYPE "public"."enum__artworks_v_version_status";`)
}
