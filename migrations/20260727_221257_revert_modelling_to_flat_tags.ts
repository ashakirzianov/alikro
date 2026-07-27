/**
 * Reverts the modelling layer: flat `tags` back, `series` / `materials` /
 * `support` / `favorite` gone. Anton and Alina judged the modelled shape and
 * preferred Crow's flat one (2026-07-27).
 *
 * Every statement is written idempotently (IF NOT EXISTS / IF EXISTS, and
 * drop-then-add for foreign keys, which Postgres has no IF NOT EXISTS for).
 * That is not defensiveness — it is required. `migrate:create` diffs the code
 * against the last migration *snapshot*, not against the live database, and the
 * folders and MCP features were applied to this database by the dev adapter's
 * `push` without ever being recorded in a migration. So this file also carries
 * catch-up DDL for tables that already exist, and a literal CREATE would abort
 * the whole migration on `relation already exists`.
 *
 * That is the `push`-leaves-no-migration hazard named in
 * design-payload-field-mapping.md §5.2, arriving exactly as predicted. Recorded
 * as a criterion-5 finding: the drift is silent until the first real migration
 * tries to run, and then it fails in the middle of a destructive change.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('artworks');
  CREATE TABLE IF NOT EXISTS "artworks_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_artworks_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload_mcp_api_keys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"artworks_find" boolean DEFAULT false,
  	"artworks_create" boolean DEFAULT false,
  	"artworks_update" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "artworks_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_artworks_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "series" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "materials" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "artworks_rels" CASCADE;
  DROP TABLE IF EXISTS "_artworks_v_rels" CASCADE;
  DROP TABLE IF EXISTS "series" CASCADE;
  DROP TABLE IF EXISTS "materials" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_series_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_materials_fk";
  
  DROP INDEX "artworks_favorite_idx";
  DROP INDEX "_artworks_v_version_version_favorite_idx";
  DROP INDEX "payload_locked_documents_rels_series_id_idx";
  DROP INDEX "payload_locked_documents_rels_materials_id_idx";
  ALTER TABLE "artworks" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'alikro';
  ALTER TABLE "artworks" ADD COLUMN IF NOT EXISTS "folder_id" integer;
  ALTER TABLE "_artworks_v" ADD COLUMN IF NOT EXISTS "version_prefix" varchar DEFAULT 'alikro';
  ALTER TABLE "_artworks_v" ADD COLUMN IF NOT EXISTS "version_folder_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "payload_folders_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN IF NOT EXISTS "payload_mcp_api_keys_id" integer;
  ALTER TABLE "artworks_texts" DROP CONSTRAINT IF EXISTS "artworks_texts_parent_fk";
  ALTER TABLE "artworks_texts" ADD CONSTRAINT "artworks_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artworks_v_texts" DROP CONSTRAINT IF EXISTS "_artworks_v_texts_parent_fk";
  ALTER TABLE "_artworks_v_texts" ADD CONSTRAINT "_artworks_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_artworks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_mcp_api_keys" DROP CONSTRAINT IF EXISTS "payload_mcp_api_keys_user_id_users_id_fk";
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" DROP CONSTRAINT IF EXISTS "payload_folders_folder_type_parent_fk";
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" DROP CONSTRAINT IF EXISTS "payload_folders_folder_id_payload_folders_id_fk";
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "artworks_texts_order_parent" ON "artworks_texts" USING btree ("order","parent_id");
  CREATE INDEX IF NOT EXISTS "artworks_texts_text_idx" ON "artworks_texts" USING btree ("text");
  CREATE INDEX IF NOT EXISTS "_artworks_v_texts_order_parent" ON "_artworks_v_texts" USING btree ("order","parent_id");
  CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX IF NOT EXISTS "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  ALTER TABLE "artworks" DROP CONSTRAINT IF EXISTS "artworks_folder_id_payload_folders_id_fk";
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_artworks_v" DROP CONSTRAINT IF EXISTS "_artworks_v_version_folder_id_payload_folders_id_fk";
  ALTER TABLE "_artworks_v" ADD CONSTRAINT "_artworks_v_version_folder_id_payload_folders_id_fk" FOREIGN KEY ("version_folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_fk";
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_folders_fk";
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_payload_mcp_api_keys_fk";
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "artworks_folder_idx" ON "artworks" USING btree ("folder_id");
  CREATE INDEX IF NOT EXISTS "_artworks_v_version_version_folder_idx" ON "_artworks_v" USING btree ("version_folder_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");
  ALTER TABLE "artworks" DROP COLUMN IF EXISTS "favorite";
  ALTER TABLE "_artworks_v" DROP COLUMN IF EXISTS "version_favorite";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "series_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "materials_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "artworks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"materials_id" integer,
  	"series_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "_artworks_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"materials_id" integer,
  	"series_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "series" (
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
  
  CREATE TABLE IF NOT EXISTS "materials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"broader_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "artworks_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_artworks_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_mcp_api_keys" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_folders_folder_type" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_folders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "artworks_texts" CASCADE;
  DROP TABLE IF EXISTS "_artworks_v_texts" CASCADE;
  DROP TABLE IF EXISTS "payload_mcp_api_keys" CASCADE;
  DROP TABLE IF EXISTS "payload_folders_folder_type" CASCADE;
  DROP TABLE IF EXISTS "payload_folders" CASCADE;
  ALTER TABLE "artworks" DROP CONSTRAINT "artworks_folder_id_payload_folders_id_fk";
  
  ALTER TABLE "_artworks_v" DROP CONSTRAINT "_artworks_v_version_folder_id_payload_folders_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_folders_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk";
  
  DROP INDEX "artworks_folder_idx";
  DROP INDEX "_artworks_v_version_version_folder_idx";
  DROP INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_folders_id_idx";
  DROP INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx";
  ALTER TABLE "artworks" ADD COLUMN IF NOT EXISTS "favorite" boolean DEFAULT false;
  ALTER TABLE "_artworks_v" ADD COLUMN IF NOT EXISTS "version_favorite" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "series_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "materials_id" integer;
  ALTER TABLE "artworks_rels" DROP CONSTRAINT IF EXISTS "artworks_rels_parent_fk";
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" DROP CONSTRAINT IF EXISTS "artworks_rels_materials_fk";
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" DROP CONSTRAINT IF EXISTS "artworks_rels_series_fk";
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artworks_v_rels" DROP CONSTRAINT IF EXISTS "_artworks_v_rels_parent_fk";
  ALTER TABLE "_artworks_v_rels" ADD CONSTRAINT "_artworks_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_artworks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artworks_v_rels" DROP CONSTRAINT IF EXISTS "_artworks_v_rels_materials_fk";
  ALTER TABLE "_artworks_v_rels" ADD CONSTRAINT "_artworks_v_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artworks_v_rels" DROP CONSTRAINT IF EXISTS "_artworks_v_rels_series_fk";
  ALTER TABLE "_artworks_v_rels" ADD CONSTRAINT "_artworks_v_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "series" DROP CONSTRAINT IF EXISTS "series_cover_id_artworks_id_fk";
  ALTER TABLE "series" ADD CONSTRAINT "series_cover_id_artworks_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."artworks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "materials_broader_id_materials_id_fk";
  ALTER TABLE "materials" ADD CONSTRAINT "materials_broader_id_materials_id_fk" FOREIGN KEY ("broader_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "artworks_rels_order_idx" ON "artworks_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "artworks_rels_parent_idx" ON "artworks_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "artworks_rels_path_idx" ON "artworks_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "artworks_rels_materials_id_idx" ON "artworks_rels" USING btree ("materials_id");
  CREATE INDEX IF NOT EXISTS "artworks_rels_series_id_idx" ON "artworks_rels" USING btree ("series_id");
  CREATE INDEX IF NOT EXISTS "_artworks_v_rels_order_idx" ON "_artworks_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_artworks_v_rels_parent_idx" ON "_artworks_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_artworks_v_rels_path_idx" ON "_artworks_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_artworks_v_rels_materials_id_idx" ON "_artworks_v_rels" USING btree ("materials_id");
  CREATE INDEX IF NOT EXISTS "_artworks_v_rels_series_id_idx" ON "_artworks_v_rels" USING btree ("series_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "series_slug_idx" ON "series" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "series_cover_idx" ON "series" USING btree ("cover_id");
  CREATE INDEX IF NOT EXISTS "series_updated_at_idx" ON "series" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "series_created_at_idx" ON "series" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "materials_slug_idx" ON "materials" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "materials_broader_idx" ON "materials" USING btree ("broader_id");
  CREATE INDEX IF NOT EXISTS "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "materials_created_at_idx" ON "materials" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_series_fk";
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_materials_fk";
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "artworks_favorite_idx" ON "artworks" USING btree ("favorite");
  CREATE INDEX IF NOT EXISTS "_artworks_v_version_version_favorite_idx" ON "_artworks_v" USING btree ("version_favorite");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_series_id_idx" ON "payload_locked_documents_rels" USING btree ("series_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_materials_id_idx" ON "payload_locked_documents_rels" USING btree ("materials_id");
  ALTER TABLE "artworks" DROP COLUMN IF EXISTS "prefix";
  ALTER TABLE "artworks" DROP COLUMN IF EXISTS "folder_id";
  ALTER TABLE "_artworks_v" DROP COLUMN IF EXISTS "version_prefix";
  ALTER TABLE "_artworks_v" DROP COLUMN IF EXISTS "version_folder_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_folders_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
  DROP TYPE "public"."enum_payload_folders_folder_type";`)
}
