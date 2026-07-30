


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."award_mission"("p_market_id" "text", "p_mission_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_slot" integer, "p_verified_by_name" "text", "p_verified_at" "text", "p_reward" integer, "p_mission_title" "text", "p_allow_self" boolean DEFAULT false) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id      text;
  v_photo_url   text;
  v_new_balance int;
BEGIN
  IF p_user_id = p_verified_by AND NOT p_allow_self THEN
    RAISE EXCEPTION 'self verification not allowed';
  END IF;

  INSERT INTO public.mission_logs (
    mission_id, user_id, verified_by, slot, verified_by_name, verified_at
  ) VALUES (
    p_mission_id, p_user_id, p_verified_by, p_slot,
    p_verified_by_name, p_verified_at::timestamptz
  )
  ON CONFLICT (mission_id, user_id, slot) DO UPDATE
    SET verified_by = EXCLUDED.verified_by,
        verified_by_name = EXCLUDED.verified_by_name,
        verified_at = EXCLUDED.verified_at,
        voided_at = NULL
    WHERE public.mission_logs.verified_at IS NULL
       OR public.mission_logs.voided_at IS NOT NULL
  RETURNING id, photo_url INTO v_log_id, v_photo_url;

  IF v_log_id IS NULL THEN
    RAISE EXCEPTION 'already exists';
  END IF;

  UPDATE public.market_participants
  SET balance = balance + p_reward
  WHERE market_id = p_market_id AND user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'participant not found';
  END IF;

  INSERT INTO public.point_logs (
    market_id, user_id, amount, reason_type,
    mission_log_id, mission_title, verified_by_name, verified_by, photo_url
  ) VALUES (
    p_market_id, p_user_id, p_reward, 'mission',
    v_log_id, p_mission_title, p_verified_by_name, p_verified_by, v_photo_url
  );

  RETURN json_build_object('missionLogId', v_log_id, 'newBalance', v_new_balance);
END;
$$;


ALTER FUNCTION "public"."award_mission"("p_market_id" "text", "p_mission_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_slot" integer, "p_verified_by_name" "text", "p_verified_at" "text", "p_reward" integer, "p_mission_title" "text", "p_allow_self" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_market_with_owner"("p_title" "text", "p_description" "text", "p_point_label" "text", "p_admin_code" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_owner_user_id" "uuid", "p_owner_display_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_market_id text;
BEGIN
  INSERT INTO public.markets (title, description, point_label, admin_code, starts_at, ends_at)
  VALUES (p_title, p_description, p_point_label, p_admin_code, p_starts_at, p_ends_at)
  RETURNING id INTO v_market_id;

  INSERT INTO public.market_participants (market_id, user_id, role, balance, display_name)
  VALUES (v_market_id, p_owner_user_id, 'owner', 0, p_owner_display_name);

  RETURN json_build_object('marketId', v_market_id);
END;
$$;


ALTER FUNCTION "public"."create_market_with_owner"("p_title" "text", "p_description" "text", "p_point_label" "text", "p_admin_code" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_owner_user_id" "uuid", "p_owner_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_manual_points"("p_market_id" "text", "p_user_id" "uuid", "p_amount" integer, "p_memo" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_balance int;
BEGIN
  UPDATE public.market_participants
  SET balance = balance + p_amount
  WHERE market_id = p_market_id AND user_id = p_user_id AND balance + p_amount >= 0
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.market_participants
      WHERE market_id = p_market_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'insufficient_balance';
    ELSE
      RAISE EXCEPTION 'participant not found';
    END IF;
  END IF;

  INSERT INTO public.point_logs (
    market_id, user_id, amount, reason_type, memo
  ) VALUES (
    p_market_id, p_user_id, p_amount, 'manual', p_memo
  );

  RETURN json_build_object('newBalance', v_new_balance);
END;
$$;


ALTER FUNCTION "public"."grant_manual_points"("p_market_id" "text", "p_user_id" "uuid", "p_amount" integer, "p_memo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_market_admin"("p_market_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.market_participants
    WHERE user_id = auth.uid() AND market_id = p_market_id AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_market_admin"("p_market_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_market_participant"("p_market_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.market_participants
    WHERE user_id = auth.uid() AND market_id = p_market_id
  );
$$;


ALTER FUNCTION "public"."is_market_participant"("p_market_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."nanoid"("size" integer DEFAULT 10, "alphabet" "text" DEFAULT '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  idBuilder     text := '';
  i             int  := 0;
  bytes         bytea;
  alphabetIndex int;
  mask          int;
  step          int;
BEGIN
  mask := (2 << cast(floor(log(length(alphabet) - 1) / log(2)) as int)) - 1;
  step := cast(ceil(1.5 * mask * size / length(alphabet)) as int);
  WHILE true LOOP
    bytes := gen_random_bytes(step);
    WHILE i < step LOOP
      alphabetIndex := (get_byte(bytes, i) & mask) + 1;
      IF alphabetIndex <= length(alphabet) THEN
        idBuilder := idBuilder || substr(alphabet, alphabetIndex, 1);
        IF length(idBuilder) = size THEN RETURN idBuilder; END IF;
      END IF;
      i := i + 1;
    END LOOP;
    i := 0;
  END LOOP;
END $$;


ALTER FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_order"("p_market_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_verified_by_name" "text", "p_items" "jsonb", "p_total" integer, "p_item_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order_id    text;
  v_new_balance int;
BEGIN
  UPDATE public.market_participants
  SET balance = balance - p_total
  WHERE market_id = p_market_id AND user_id = p_user_id AND balance >= p_total
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'insufficient balance or participant not found';
  END IF;

  INSERT INTO public.orders (
    market_id, user_id, verified_by, verified_by_name, items, total
  ) VALUES (
    p_market_id, p_user_id, p_verified_by, p_verified_by_name, p_items, p_total
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.point_logs (
    market_id, user_id, amount, reason_type, order_id, item_name
  ) VALUES (
    p_market_id, p_user_id, -p_total, 'purchase', v_order_id, p_item_name
  );

  RETURN json_build_object('orderId', v_order_id, 'newBalance', v_new_balance);
END;
$$;


ALTER FUNCTION "public"."process_order"("p_market_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_verified_by_name" "text", "p_items" "jsonb", "p_total" integer, "p_item_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_point_log"("p_market_id" "text", "p_log_id" "text", "p_voided_by" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log         record;
  v_new_balance int;
BEGIN
  SELECT * INTO v_log
  FROM public.point_logs
  WHERE id = p_log_id AND market_id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'log not found';
  END IF;

  IF v_log.reason_type NOT IN ('mission', 'manual') THEN
    RAISE EXCEPTION 'not revocable';
  END IF;

  IF v_log.voided_at IS NOT NULL THEN
    RAISE EXCEPTION 'already voided';
  END IF;

  UPDATE public.market_participants
  SET balance = balance - v_log.amount
  WHERE market_id = p_market_id AND user_id = v_log.user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'participant not found';
  END IF;

  UPDATE public.point_logs
  SET voided_at = now(), voided_by = p_voided_by
  WHERE id = p_log_id;

  IF v_log.mission_log_id IS NOT NULL THEN
    UPDATE public.mission_logs
    SET voided_at = now()
    WHERE id = v_log.mission_log_id;
  END IF;

  RETURN json_build_object('newBalance', v_new_balance);
END;
$$;


ALTER FUNCTION "public"."revoke_point_log"("p_market_id" "text", "p_log_id" "text", "p_voided_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_points"("p_market_id" "text", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer, "p_memo" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_from_balance integer;
BEGIN
  -- 두 참가자 row를 user_id 오름차순으로 함께 잠가 상호 송금 시 데드락을 방지
  PERFORM 1 FROM market_participants
  WHERE market_id = p_market_id AND user_id IN (p_from_user_id, p_to_user_id)
  ORDER BY user_id
  FOR UPDATE;

  SELECT balance INTO v_from_balance
  FROM market_participants
  WHERE market_id = p_market_id AND user_id = p_from_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'sender_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM market_participants
    WHERE market_id = p_market_id AND user_id = p_to_user_id
  ) THEN
    RAISE EXCEPTION 'recipient_not_found';
  END IF;

  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  UPDATE market_participants
  SET balance = balance - p_amount
  WHERE market_id = p_market_id AND user_id = p_from_user_id;

  UPDATE market_participants
  SET balance = balance + p_amount
  WHERE market_id = p_market_id AND user_id = p_to_user_id;

  INSERT INTO point_logs (market_id, user_id, amount, reason_type, memo)
  VALUES
    (p_market_id, p_from_user_id, -p_amount, 'transfer', p_memo),
    (p_market_id, p_to_user_id,   p_amount,  'transfer', p_memo);

  RETURN jsonb_build_object('new_balance', v_from_balance - p_amount);
END;
$$;


ALTER FUNCTION "public"."transfer_points"("p_market_id" "text", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer, "p_memo" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."market_items" (
    "name" "text" NOT NULL,
    "price" integer NOT NULL,
    "id" "text" DEFAULT "public"."nanoid"() NOT NULL,
    "market_id" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."market_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_participants" (
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "balance" integer DEFAULT 0 NOT NULL,
    "id" "text" DEFAULT "public"."nanoid"() NOT NULL,
    "market_id" "text" NOT NULL,
    "display_name" "text",
    CONSTRAINT "market_participants_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'user'::"text", 'owner'::"text"])))
);

ALTER TABLE ONLY "public"."market_participants" REPLICA IDENTITY FULL;


ALTER TABLE "public"."market_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."markets" (
    "title" "text" NOT NULL,
    "description" "text",
    "point_label" "text" DEFAULT '달란트'::"text" NOT NULL,
    "admin_code" "text" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "text" DEFAULT "public"."nanoid"() NOT NULL,
    CONSTRAINT "markets_admin_code_four_digits" CHECK (("admin_code" ~ '^[0-9]{4}$'::"text"))
);


ALTER TABLE "public"."markets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mission_logs" (
    "user_id" "uuid" NOT NULL,
    "verified_by" "uuid",
    "slot" integer DEFAULT 1 NOT NULL,
    "photo_url" "text",
    "verified_at" timestamp with time zone DEFAULT "now"(),
    "verified_by_name" "text",
    "id" "text" DEFAULT "public"."nanoid"() NOT NULL,
    "mission_id" "text" NOT NULL,
    "voided_at" timestamp with time zone
);


ALTER TABLE "public"."mission_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."missions" (
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "is_group" boolean DEFAULT false NOT NULL,
    "reward" integer NOT NULL,
    "limit_count" integer,
    "active_from" timestamp with time zone,
    "active_until" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "text" DEFAULT "public"."nanoid"() NOT NULL,
    "market_id" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "reward_min" integer,
    "reward_max" integer,
    CONSTRAINT "missions_reward_range_check" CHECK (((("reward_min" IS NULL) AND ("reward_max" IS NULL)) OR (("reward_min" IS NOT NULL) AND ("reward_max" IS NOT NULL) AND ("reward_min" >= 0) AND ("reward_max" >= "reward_min")))),
    CONSTRAINT "missions_type_check" CHECK (("type" = ANY (ARRAY['user_qr'::"text", 'upload'::"text", 'admin_qr'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."missions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "user_id" "uuid" NOT NULL,
    "verified_by" "uuid",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total" integer NOT NULL,
    "purchased_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified_by_name" "text",
    "id" "text" DEFAULT "public"."nanoid"() NOT NULL,
    "market_id" "text" NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_logs" (
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "reason_type" "text" NOT NULL,
    "memo" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mission_title" "text",
    "verified_by_name" "text",
    "item_name" "text",
    "id" "text" DEFAULT "public"."nanoid"() NOT NULL,
    "market_id" "text" NOT NULL,
    "mission_log_id" "text",
    "order_id" "text",
    "voided_at" timestamp with time zone,
    "voided_by" "uuid",
    "photo_url" "text",
    "verified_by" "uuid",
    CONSTRAINT "point_logs_reason_type_check" CHECK (("reason_type" = ANY (ARRAY['mission'::"text", 'purchase'::"text", 'manual'::"text", 'transfer'::"text"])))
);


ALTER TABLE "public"."point_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "real_name" "text" NOT NULL,
    "birth_date" "date" NOT NULL,
    "gender" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text",
    "can_create_market" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."market_items"
    ADD CONSTRAINT "market_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_participants"
    ADD CONSTRAINT "market_participants_market_id_user_id_key" UNIQUE ("market_id", "user_id");



ALTER TABLE ONLY "public"."market_participants"
    ADD CONSTRAINT "market_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."markets"
    ADD CONSTRAINT "markets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_mission_id_user_id_slot_key" UNIQUE ("mission_id", "user_id", "slot");



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_items"
    ADD CONSTRAINT "market_items_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");



ALTER TABLE ONLY "public"."market_participants"
    ADD CONSTRAINT "market_participants_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");



ALTER TABLE ONLY "public"."market_participants"
    ADD CONSTRAINT "market_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id");



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mission_logs"
    ADD CONSTRAINT "mission_logs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_mission_log_id_fkey" FOREIGN KEY ("mission_log_id") REFERENCES "public"."mission_logs"("id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id");



CREATE POLICY "items_delete" ON "public"."market_items" FOR DELETE USING ("public"."is_market_admin"("market_id"));



CREATE POLICY "items_insert" ON "public"."market_items" FOR INSERT WITH CHECK ("public"."is_market_admin"("market_id"));



CREATE POLICY "items_select" ON "public"."market_items" FOR SELECT USING ("public"."is_market_participant"("market_id"));



CREATE POLICY "items_update" ON "public"."market_items" FOR UPDATE USING ("public"."is_market_admin"("market_id"));



ALTER TABLE "public"."market_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."markets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "markets_select" ON "public"."markets" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."mission_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."missions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "missions_delete" ON "public"."missions" FOR DELETE USING ("public"."is_market_admin"("market_id"));



CREATE POLICY "missions_insert" ON "public"."missions" FOR INSERT WITH CHECK ("public"."is_market_admin"("market_id"));



CREATE POLICY "missions_select" ON "public"."missions" FOR SELECT USING ("public"."is_market_participant"("market_id"));



CREATE POLICY "missions_update" ON "public"."missions" FOR UPDATE USING ("public"."is_market_admin"("market_id"));



CREATE POLICY "mlogs_insert" ON "public"."mission_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."missions" "ms"
  WHERE (("ms"."id" = "mission_logs"."mission_id") AND "public"."is_market_admin"("ms"."market_id")))));



CREATE POLICY "mlogs_select" ON "public"."mission_logs" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."missions" "ms"
  WHERE (("ms"."id" = "mission_logs"."mission_id") AND "public"."is_market_admin"("ms"."market_id"))))));



CREATE POLICY "mp_insert" ON "public"."market_participants" FOR INSERT TO "authenticated" WITH CHECK (((("user_id" = "auth"."uid"())) AND (("role" = 'user'::"text")) AND (("balance" = 0))));



CREATE POLICY "mp_select" ON "public"."market_participants" FOR SELECT TO "authenticated" USING ("public"."is_market_participant"("market_id"));



CREATE POLICY "mp_update" ON "public"."market_participants" FOR UPDATE USING ("public"."is_market_admin"("market_id"));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_insert" ON "public"."orders" FOR INSERT WITH CHECK ("public"."is_market_admin"("market_id"));



CREATE POLICY "orders_select" ON "public"."orders" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_market_admin"("market_id")));



CREATE POLICY "plogs_insert" ON "public"."point_logs" FOR INSERT WITH CHECK ("public"."is_market_admin"("market_id"));



CREATE POLICY "plogs_select" ON "public"."point_logs" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_market_admin"("market_id")));



ALTER TABLE "public"."point_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "users_select" ON "public"."users" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."market_participants" "mp_self"
     JOIN "public"."market_participants" "mp_target" ON (("mp_self"."market_id" = "mp_target"."market_id")))
  WHERE (("mp_self"."user_id" = "auth"."uid"()) AND ("mp_target"."user_id" = "users"."id"))))));



CREATE POLICY "users_update" ON "public"."users" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."market_participants";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."award_mission"("p_market_id" "text", "p_mission_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_slot" integer, "p_verified_by_name" "text", "p_verified_at" "text", "p_reward" integer, "p_mission_title" "text", "p_allow_self" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."award_mission"("p_market_id" "text", "p_mission_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_slot" integer, "p_verified_by_name" "text", "p_verified_at" "text", "p_reward" integer, "p_mission_title" "text", "p_allow_self" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_market_with_owner"("p_title" "text", "p_description" "text", "p_point_label" "text", "p_admin_code" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_owner_user_id" "uuid", "p_owner_display_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_market_with_owner"("p_title" "text", "p_description" "text", "p_point_label" "text", "p_admin_code" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_owner_user_id" "uuid", "p_owner_display_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."grant_manual_points"("p_market_id" "text", "p_user_id" "uuid", "p_amount" integer, "p_memo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."grant_manual_points"("p_market_id" "text", "p_user_id" "uuid", "p_amount" integer, "p_memo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_market_admin"("p_market_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_market_admin"("p_market_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_market_admin"("p_market_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_market_participant"("p_market_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_market_participant"("p_market_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_market_participant"("p_market_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_order"("p_market_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_verified_by_name" "text", "p_items" "jsonb", "p_total" integer, "p_item_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_order"("p_market_id" "text", "p_user_id" "uuid", "p_verified_by" "uuid", "p_verified_by_name" "text", "p_items" "jsonb", "p_total" integer, "p_item_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."revoke_point_log"("p_market_id" "text", "p_log_id" "text", "p_voided_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revoke_point_log"("p_market_id" "text", "p_log_id" "text", "p_voided_by" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."transfer_points"("p_market_id" "text", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer, "p_memo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."transfer_points"("p_market_id" "text", "p_from_user_id" "uuid", "p_to_user_id" "uuid", "p_amount" integer, "p_memo" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."market_items" TO "anon";
GRANT ALL ON TABLE "public"."market_items" TO "authenticated";
GRANT ALL ON TABLE "public"."market_items" TO "service_role";



GRANT ALL ON TABLE "public"."market_participants" TO "anon";
GRANT ALL ON TABLE "public"."market_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."market_participants" TO "service_role";



GRANT SELECT ("id", "title", "description", "point_label", "starts_at", "ends_at", "created_at") ON TABLE "public"."markets" TO "authenticated";
GRANT ALL ON TABLE "public"."markets" TO "service_role";



GRANT ALL ON TABLE "public"."mission_logs" TO "anon";
GRANT ALL ON TABLE "public"."mission_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."mission_logs" TO "service_role";



GRANT ALL ON TABLE "public"."missions" TO "anon";
GRANT ALL ON TABLE "public"."missions" TO "authenticated";
GRANT ALL ON TABLE "public"."missions" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."point_logs" TO "anon";
GRANT ALL ON TABLE "public"."point_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."point_logs" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































