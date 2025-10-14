CREATE TABLE "public"."favorites" ( 
  "user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now() ,
  "type" INTEGER NOT NULL,
  "group_id" INTEGER NULL,
  "tmdb_id" INTEGER NOT NULL,
  "id" SERIAL
);
CREATE TABLE "public"."genres" ( 
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Genres_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."group_members" ( 
  "group_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "role" USER-DEFINED NOT NULL DEFAULT 'member'::group_member_role ,
  "joined_at" TIMESTAMP NOT NULL DEFAULT now() ,
  CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id"),
  CONSTRAINT "unique_group_members" UNIQUE ("group_id", "user_id")
);
CREATE TABLE "public"."group_themes" ( 
  "id" SERIAL,
  "name" TEXT NOT NULL,
  "theme" TEXT NOT NULL DEFAULT 'default'::text ,
  CONSTRAINT "group_themes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."groups" ( 
  "id" SERIAL,
  "name" VARCHAR(60) NOT NULL,
  "owner_id" INTEGER NOT NULL,
  "description" TEXT NULL,
  "theme_id" INTEGER NULL,
  "visibility" TEXT NOT NULL DEFAULT 'public'::text ,
  "created_at" TIMESTAMP NOT NULL DEFAULT now() ,
  "poster_url" TEXT NULL,
  CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."interactions" ( 
  "id" SERIAL,
  "target_id" INTEGER NOT NULL,
  "target_type" USER-DEFINED NOT NULL,
  "user_id" INTEGER NOT NULL,
  "type" USER-DEFINED NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now() ,
  CONSTRAINT "interactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "interactions_target_id_target_type_user_id_key" UNIQUE ("target_id", "target_type", "user_id")
);
CREATE TABLE "public"."movies" ( 
  "id" VARCHAR(255) NOT NULL,
  "original_title" TEXT NOT NULL,
  "tmdb_id" INTEGER NOT NULL,
  "release_year" INTEGER NULL,
  "poster_url" TEXT NULL,
  "f_id" INTEGER NULL,
  CONSTRAINT "movies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "unique_tmdb_id" UNIQUE ("tmdb_id")
);
CREATE TABLE "public"."reviews" ( 
  "id" SERIAL,
  "movie_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL,
  "content" TEXT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now() ,
  "updated_at" TIMESTAMP NULL,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reviews_movie_id_user_id_key" UNIQUE ("movie_id", "user_id")
);
CREATE TABLE "public"."tags" ( 
  "group_id" INTEGER NOT NULL,
  "genre_id" INTEGER NOT NULL,
  CONSTRAINT "unique_tags" UNIQUE ("group_id", "genre_id")
);
CREATE TABLE "public"."user_roles" ( 
  "user_id" INTEGER NOT NULL,
  "role" TEXT NULL,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id")
);
CREATE TABLE "public"."users" ( 
  "id" SERIAL,
  "email" USER-DEFINED NOT NULL,
  "username" USER-DEFINED NOT NULL,
  "password_hash" TEXT NOT NULL,
  "account_type_id" INTEGER NOT NULL DEFAULT 1 ,
  "real_name" VARCHAR(50) NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() ,
  "last_activity_at" TIMESTAMP WITH TIME ZONE NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE NULL,
  "user_bio" TEXT NULL,
  "date_of_birth" DATE NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key" UNIQUE ("email"),
  CONSTRAINT "users_username_key" UNIQUE ("username")
);
ALTER TABLE "public"."favorites" DISABLE TRIGGER ALL;
ALTER TABLE "public"."genres" DISABLE TRIGGER ALL;
ALTER TABLE "public"."group_members" DISABLE TRIGGER ALL;
ALTER TABLE "public"."group_themes" DISABLE TRIGGER ALL;
ALTER TABLE "public"."groups" DISABLE TRIGGER ALL;
ALTER TABLE "public"."interactions" DISABLE TRIGGER ALL;
ALTER TABLE "public"."movies" DISABLE TRIGGER ALL;
ALTER TABLE "public"."reviews" DISABLE TRIGGER ALL;
ALTER TABLE "public"."tags" DISABLE TRIGGER ALL;
ALTER TABLE "public"."user_roles" DISABLE TRIGGER ALL;
ALTER TABLE "public"."users" DISABLE TRIGGER ALL;
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 12:45:08.123162', 2, NULL, 1086910, 361);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 12:45:10.88266', 2, NULL, 1311031, 362);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 12:45:13.473781', 2, NULL, 755898, 363);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 12:45:16.404116', 2, NULL, 338969, 364);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 12:45:21.016018', 2, NULL, 1186350, 365);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:03.161277', 2, NULL, 1086910, 366);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:03.643739', 1, NULL, 1086910, 367);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:04.325305', 2, NULL, 1311031, 368);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:04.792498', 1, NULL, 1311031, 369);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:05.426624', 2, NULL, 755898, 370);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:06.163948', 1, NULL, 941109, 371);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:07.025112', 2, NULL, 793387, 372);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:07.498211', 1, NULL, 793387, 373);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:08.196242', 1, NULL, 1186350, 374);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:08.93036', 2, NULL, 338969, 375);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:09.596822', 2, NULL, 617126, 376);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:10.386288', 2, NULL, 986097, 377);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:10.865046', 1, NULL, 1257009, 378);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 15:56:11.496476', 1, NULL, 1290879, 379);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 15:57:12.345721', 1, NULL, 1086910, 380);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 15:57:56.524947', 1, NULL, 1186350, 381);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (2, '2025-10-14 16:01:02.019588', 2, NULL, 1038392, 382);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (2, '2025-10-14 16:01:02.33683', 1, NULL, 1038392, 383);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 16:12:58.830429', 1, NULL, 1038392, 384);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 16:13:00.457779', 2, NULL, 1038392, 385);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 16:21:33.805372', 3, 70, 1218925, 387);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 16:21:40.998349', 3, 70, 803796, 388);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 16:21:51.991152', 1, NULL, 617126, 389);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 16:24:25.359623', 3, 72, 1086910, 390);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 16:25:53.980735', 3, 70, 1022787, 392);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 16:27:13.884686', 3, 72, 1038392, 393);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (1, '2025-10-14 16:33:56.184555', 3, 70, 1311031, 394);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 16:37:00.070434', 2, NULL, 793387, 395);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (6, '2025-10-14 16:37:00.383245', 1, NULL, 793387, 396);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (7, '2025-10-14 17:11:32.254627', 2, NULL, 338969, 398);
INSERT INTO "public"."favorites" ("user_id", "created_at", "type", "group_id", "tmdb_id", "id") VALUES (7, '2025-10-14 17:11:32.778318', 1, NULL, 338969, 399);
INSERT INTO "public"."genres" ("id", "name") VALUES (28, 'Action');
INSERT INTO "public"."genres" ("id", "name") VALUES (12, 'Adventure');
INSERT INTO "public"."genres" ("id", "name") VALUES (16, 'Animation');
INSERT INTO "public"."genres" ("id", "name") VALUES (35, 'Comedy');
INSERT INTO "public"."genres" ("id", "name") VALUES (80, 'Crime');
INSERT INTO "public"."genres" ("id", "name") VALUES (99, 'Documentary');
INSERT INTO "public"."genres" ("id", "name") VALUES (18, 'Drama');
INSERT INTO "public"."genres" ("id", "name") VALUES (10751, 'Family');
INSERT INTO "public"."genres" ("id", "name") VALUES (14, 'Fantasy');
INSERT INTO "public"."genres" ("id", "name") VALUES (36, 'History');
INSERT INTO "public"."genres" ("id", "name") VALUES (27, 'Horror');
INSERT INTO "public"."genres" ("id", "name") VALUES (10402, 'Music');
INSERT INTO "public"."genres" ("id", "name") VALUES (9648, 'Mystery');
INSERT INTO "public"."genres" ("id", "name") VALUES (10749, 'Romance');
INSERT INTO "public"."genres" ("id", "name") VALUES (878, 'Science Fiction');
INSERT INTO "public"."genres" ("id", "name") VALUES (10770, 'TV Movie');
INSERT INTO "public"."genres" ("id", "name") VALUES (53, 'Thriller');
INSERT INTO "public"."genres" ("id", "name") VALUES (10752, 'War');
INSERT INTO "public"."genres" ("id", "name") VALUES (37, 'Western');
INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "joined_at") VALUES (70, 1, 'owner', '2025-10-13 19:21:44.92648');
INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "joined_at") VALUES (71, 2, 'owner', '2025-10-13 19:22:07.076444');
INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "joined_at") VALUES (72, 6, 'owner', '2025-10-14 12:19:16.705325');
INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "joined_at") VALUES (72, 7, 'member', '2025-10-14 12:38:56.913469');
INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "joined_at") VALUES (70, 6, 'moderator', '2025-10-14 16:40:32.539853');
INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "joined_at") VALUES (74, 9, 'owner', '2025-10-14 17:29:31.599192');
INSERT INTO "public"."group_members" ("group_id", "user_id", "role", "joined_at") VALUES (74, 2, 'pending', '2025-10-14 17:33:01.506146');
INSERT INTO "public"."group_themes" ("id", "name", "theme") VALUES (1, 'Pastel Blue', 'theme-blue');
INSERT INTO "public"."group_themes" ("id", "name", "theme") VALUES (2, 'Pastel Green', 'theme-green');
INSERT INTO "public"."group_themes" ("id", "name", "theme") VALUES (3, 'Pastel Purple', 'theme-purple');
INSERT INTO "public"."group_themes" ("id", "name", "theme") VALUES (4, 'Pastel Orange', 'theme-orange');
INSERT INTO "public"."groups" ("id", "name", "owner_id", "description", "theme_id", "visibility", "created_at", "poster_url") VALUES (71, 'Mikki Hiiri', 2, 'The Walt Disney Company, commonly referred to as simply Disney, is an American multinational mass media and entertainment conglomerate headquartered at the Walt Disney Studios complex in Burbank, California. Disney was founded on October 16, 1923, as an animation studio by brothers Walt Disney and Roy Oliver Disney as Disney Brothers Cartoon Studio; it later operated under the names Walt Disney Studio and Walt Disney Productions before adopting its current name in 1986. In 1928, Disney established itself as a leader in the animation industry with the short film Steamboat Willie. The film used synchronized sound to become the first post-produced sound cartoon, and popularized Mickey Mouse,[4] who became Disney''s mascot and corporate icon.[5]', NULL, 'public', '2025-10-13 19:22:07.076444', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/The_Walt_Disney_company_logo.svg/500px-The_Walt_Disney_company_logo.svg.png');
INSERT INTO "public"."groups" ("id", "name", "owner_id", "description", "theme_id", "visibility", "created_at", "poster_url") VALUES (72, 'Drama Llamas', 6, '', 1, 'public', '2025-10-14 12:19:16.705325', NULL);
INSERT INTO "public"."groups" ("id", "name", "owner_id", "description", "theme_id", "visibility", "created_at", "poster_url") VALUES (70, 'Anime Lovers', 1, 'We love anime more than you think', NULL, 'private', '2025-10-13 19:21:44.92648', 'https://static01.nyt.com/images/2025/08/14/12visualUploader-8432-cover/12visualUploader-8432-cover-jumbo-v2.jpg');
INSERT INTO "public"."groups" ("id", "name", "owner_id", "description", "theme_id", "visibility", "created_at", "poster_url") VALUES (74, 'Updated Group Name', 9, '', 2, 'private', '2025-10-14 17:29:31.599192', 'https://example.com/new-poster.jpg');
INSERT INTO "public"."interactions" ("id", "target_id", "target_type", "user_id", "type", "created_at") VALUES (480, 66, 'review', 9, 'like', '2025-10-14 17:28:01.448503');
INSERT INTO "public"."interactions" ("id", "target_id", "target_type", "user_id", "type", "created_at") VALUES (481, 65, 'review', 9, 'dislike', '2025-10-14 17:28:09.664589');
INSERT INTO "public"."interactions" ("id", "target_id", "target_type", "user_id", "type", "created_at") VALUES (483, 65, 'review', 7, 'like', '2025-10-14 17:30:45.115398');
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('4', 'The Lost Princess', 1086910, 2025, 'https://image.tmdb.org/t/p/w500/31S2ISsDtbnxb0kuXZl1SxSMD0K.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('5', 'Marco', 1186350, 2024, 'https://image.tmdb.org/t/p/w500/il3ao5gcF6fZNqo1o9o7lusmEyU.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('6', 'Play Dirty', 941109, 2025, 'https://image.tmdb.org/t/p/w500/ovZ0zq0NwRghtWI1oLaM0lWuoEw.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('7', 'Holy Night: Demon Hunters', 793387, 2025, 'https://image.tmdb.org/t/p/w500/v3Mo77Qjp6pctpD4eJaNT6kFRSB.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('9', 'War of the Worlds', 755898, 2025, 'https://image.tmdb.org/t/p/w500/yvirUYrva23IudARHn3mMGVxWqM.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('10', 'The Fantastic 4: First Steps', 617126, 2025, 'https://image.tmdb.org/t/p/w500/cm8TNGBGG0aBfWj0LgrESHv8tir.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('11', 'Primitive War', 1257009, 2025, 'https://image.tmdb.org/t/p/w500/nWBqU5YXmDVJWWEDJ4u3ZSseNVL.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('12', 'Fight Another Day', 1053008, 2024, 'https://image.tmdb.org/t/p/w500/fKnLt1xQV0RdpN6RViowEiD1dFW.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('13', 'HIM', 986097, 2025, 'https://image.tmdb.org/t/p/w500/qPJzcYR2f1O1uynYBCVPPJuOiAH.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('14', 'Mantis', 1267319, 2025, 'https://image.tmdb.org/t/p/w500/xS9bbciDC5lHPgl79SrPyzxKAXL.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('15', 'Prisoner of War', 1328803, 2025, 'https://image.tmdb.org/t/p/w500/1XET89sjRm9mUuHXhGIlKTNd5uD.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('16', 'The Lost Bus', 1236470, 2025, 'https://image.tmdb.org/t/p/w500/zpygCOYY1DPBkeUsrrznLRN5js5.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('17', 'Django Undisputed', 1357886, 2024, 'https://image.tmdb.org/t/p/w500/porcUhC4jqFt72TaxbjOQo2lTzL.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('19', 'KPop Demon Hunters', 803796, 2025, 'https://image.tmdb.org/t/p/w500/22AouvwlhlXbe3nrFcjzL24bvWH.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('21', 'Assassin', 1552819, 2025, 'https://image.tmdb.org/t/p/w500/fLRCNUz3MsnC0MdhaWpw3hp4Eye.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('22', 'Valiant One', 1009640, 2025, 'https://image.tmdb.org/t/p/w500/sT8Z14RDCAd6szzxzWFAU4xcMwg.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('23', 'Jurassic Triangle', 1032448, 2024, 'https://image.tmdb.org/t/p/w500/yLxLz8RHiOLtNvKCtJYQgDFXqBU.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('24', 'xXx', 7451, 2002, 'https://image.tmdb.org/t/p/w500/xeEw3eLeSFmJgXZzmF2Efww0q3s.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('25', 'Rumpelstiltskin', 1385169, 2025, 'https://image.tmdb.org/t/p/w500/2irI6Bx5dU754W52rReruUj3RI2.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('26', 'How to Train Your Dragon', 1087192, 2025, 'https://image.tmdb.org/t/p/w500/53dsJ3oEnBhTBVMigWJ9tkA5bzJ.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('28', 'Nobody 2', 1007734, 2025, 'https://image.tmdb.org/t/p/w500/xGLoqM9peusKQeuwlSw2Qlhx740.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('29', 'Mission: Impossible - The Final Reckoning', 575265, 2025, 'https://image.tmdb.org/t/p/w500/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('30', 'Chainsaw Man - The Movie: Reze Arc', 1218925, 2025, 'https://image.tmdb.org/t/p/w500/xdzLBZjCVSEsic7m7nJc4jNJZVW.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('33', 'Compulsion', 1109406, 2024, 'https://image.tmdb.org/t/p/w500/s3MzSdsMcmxmpVJMuH5ezNPjzs7.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('35', 'Bloody Axe Wound', 1396558, 2024, 'https://image.tmdb.org/t/p/w500/dS9sU5JGnkmEVZ9ubgnJa6RMLwx.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('36', 'Steve', 1242404, 2025, 'https://image.tmdb.org/t/p/w500/wmLoMyofbseLfxiGgk1Iz5H97c3.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('37', 'The Man in My Basement', 957121, 2025, 'https://image.tmdb.org/t/p/w500/1zpeH8wOrM8p2TTAmBetwhe2BIx.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('39', 'Together', 1242011, 2025, 'https://image.tmdb.org/t/p/w500/m52XidzKx94bKlToZfEXUnL3pdy.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('41', 'My Fault', 1010581, 2023, 'https://image.tmdb.org/t/p/w500/w46Vw536HwNnEzOa7J24YH9DPRS.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('42', 'Lilo & Stitch', 552524, 2025, 'https://image.tmdb.org/t/p/w500/ckQzKpQJO4ZQDCN5evdpKcfm7Ys.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('43', 'The Day the Earth Blew Up: A Looney Tunes Movie', 870360, 2024, 'https://image.tmdb.org/t/p/w500/s2lB1kaYCdGSnZX5meQCiOR6HfX.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('46', 'Ne Zha 2', 980477, 2025, 'https://image.tmdb.org/t/p/w500/cb5NyNrqiCNNoDkA8FfxHAtypdG.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('47', 'Stay', 1547527, 2025, 'https://image.tmdb.org/t/p/w500/8CU1zgwlrwptRoOBkgWK5gxKT1o.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('48', 'Ice Road: Vengeance', 1119878, 2025, 'https://image.tmdb.org/t/p/w500/cQN9rZj06rXMVkk76UF1DfBAico.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('49', 'Ruth & Boaz', 1371189, 2025, 'https://image.tmdb.org/t/p/w500/mtMJEIHjeHcLtvP0tFPAptk1Var.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('50', 'Possession Street', 1178764, 2024, 'https://image.tmdb.org/t/p/w500/uNrBz1wrWszAVvOoyWPySbXWoxz.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('51', 'Ballerina', 541671, 2025, 'https://image.tmdb.org/t/p/w500/4sbqReLivBN4e7OOwG6PkSGcKHt.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('52', 'The Ugly Stepsister', 1284120, 2025, 'https://image.tmdb.org/t/p/w500/crX9rSg9EohybhkEe8iTQUCe55y.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('53', 'French Lover', 1289888, 2025, 'https://image.tmdb.org/t/p/w500/jekag0zxQ15kuMEQsc58r6UN3Ny.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('54', 'Laila', 1403735, 2025, 'https://image.tmdb.org/t/p/w500/l4gsNxFPGpzbq0D6QK1a8vO1lBz.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('55', 'Interstellar', 157336, 2014, 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('56', 'Your Fault', 1156593, 2024, 'https://image.tmdb.org/t/p/w500/1sQA7lfcF9yUyoLYC0e6Zo3jmxE.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('57', 'Elio', 1022787, 2025, 'https://image.tmdb.org/t/p/w500/7z8jDiTZZco9moIKpTUImFtTy7o.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('58', 'Avatar: The Way of Water', 76600, 2022, 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('59', 'Putin', 1255795, 2025, 'https://image.tmdb.org/t/p/w500/j3Q2MrpmaOrKfN2pInNvRNhYa4G.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('60', 'Humane', 914215, 2024, 'https://image.tmdb.org/t/p/w500/ecOvKaoM1hwQbp0uTnULGrSV32e.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('61', 'Red Sonja', 13494, 2025, 'https://image.tmdb.org/t/p/w500/aE3yh4y0h96CZZpLo0UDFMWZAA9.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('3', 'The Toxic Avenger Unrated', 338969, 2025, 'https://image.tmdb.org/t/p/w500/sIonGSpGNtH72OzbJllPOEMNjVU.jpg', 2276953);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('32', 'F1', 911430, 2025, 'https://image.tmdb.org/t/p/w500/9PXZIUsSDh4alB80jheWX4fhZmy.jpg', 2277516);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('44', 'The Naked Gun', 1035259, 2025, 'https://image.tmdb.org/t/p/w500/rmwQ8GsdQ1M3LtemNWLErle2nBU.jpg', 2277912);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2', 'The Conjuring: Last Rites', 1038392, 2025, 'https://image.tmdb.org/t/p/w500/7JzOmJ1fIU43I3gLHYsY8UzNzjG.jpg', 2277539);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('18', 'One Battle After Another', 1054867, 2025, 'https://image.tmdb.org/t/p/w500/m1jFoahEbeQXtx4zArT2FKdbNIj.jpg', 2277559);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('45', 'Freakier Friday', 1125257, 2025, 'https://image.tmdb.org/t/p/w500/9wV65OmsjLAqBfDnYTkMPutXH8j.jpg', 2277529);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('27', 'Weapons', 1078605, 2025, 'https://image.tmdb.org/t/p/w500/cpf7vsRZ0MYRQcnLWteD5jK9ymT.jpg', 2277518);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('40', 'Aztec Batman: Clash of Empires', 987400, 2025, 'https://image.tmdb.org/t/p/w500/s0Mlo5w4INp3bUdsJo3RaSSMXWz.jpg', 2277575);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('31', 'Jurassic World Rebirth', 1234821, 2025, 'https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg', 2277594);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('20', 'Superman', 1061474, 2025, 'https://image.tmdb.org/t/p/w500/wPLysNDLffQLOVebZQCbXJEv6E6.jpg', 2277517);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('1', 'Caught Stealing', 1245993, 2025, 'https://image.tmdb.org/t/p/w500/yzhay59xLcHwvcsGfpqzh6zcgfG.jpg', 2277546);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('34', 'TRON: Ares', 533533, 2025, 'https://image.tmdb.org/t/p/w500/chpWmskl3aKm1aTZqUHRCtviwPy.jpg', 2277569);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('62', '28 Years Later', 1100988, 2025, 'https://image.tmdb.org/t/p/w500/mIg1qCkVxnAlM2TK3RUF0tdEXlE.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('63', 'All of You', 1319965, 2025, 'https://image.tmdb.org/t/p/w500/U2KFjtXN9NL9eCENB28w42Jakp.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('64', 'Maintenance Required', 1352755, 2025, 'https://image.tmdb.org/t/p/w500/lM7Q1y0pmHPWZCPmGkAWGKdgu6W.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('65', 'Our Fault', 1156594, 2025, 'https://image.tmdb.org/t/p/w500/yzqHt4m1SeY9FbPrfZ0C2Hi9x1s.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('66', 'Mantis', 1498658, 2025, 'https://image.tmdb.org/t/p/w500/AvoOuMkzckcd9eozRnoZlpfY12A.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('67', 'The Thing Behind The Door', 691363, 2023, 'https://image.tmdb.org/t/p/w500/ouEJLj6eZuQZUZ6bf69RJg9g0lQ.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('68', 'Striking Rescue', 1382406, 2024, 'https://image.tmdb.org/t/p/w500/nML8rOI4GOiiEsXgknuhZeUF8M7.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('69', 'Locos de amor, mi primer amor', 1131494, 2025, 'https://image.tmdb.org/t/p/w500/hFpBUlAlHwbm2CwGJQeRbJ8N6Je.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('70', 'M3GAN 2.0', 1071585, 2025, 'https://image.tmdb.org/t/p/w500/4a63rQqIDTrYNdcnTXdPsQyxVLo.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('71', 'The Avengers', 24428, 2012, 'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('72', 'As Good as Dead', 1028248, 2022, 'https://image.tmdb.org/t/p/w500/qqQPxxRQqfLrq0ubfDQCwhJHZ91.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('73', 'Ne Zha', 615453, 2019, 'https://image.tmdb.org/t/p/w500/phM9bb6s9c60LA8qwsdk7U1N2cS.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('74', 'Sinners', 1233413, 2025, 'https://image.tmdb.org/t/p/w500/4CkZl1LK6a5rXBqJB2ZP77h3N5i.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('75', 'Karate Kid: Legends', 1011477, 2025, 'https://image.tmdb.org/t/p/w500/AEgggzRr1vZCLY86MAp93li43z.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('77', 'My Fault: London', 1294203, 2025, 'https://image.tmdb.org/t/p/w500/ttN5D6GKOwKWHmCzDGctAvaNMAi.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('78', 'The Conjuring', 138843, 2013, 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('79', 'Holy Cow', 1079310, 2024, 'https://image.tmdb.org/t/p/w500/k4LIwOO1GvvHcJOHXsynZsQrNYe.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('80', 'Sorority', 1477114, 2025, 'https://image.tmdb.org/t/p/w500/zibf9SwgiEW7Od5kwdRLSoQygRd.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('81', 'Moana 2', 1241982, 2024, 'https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('82', 'Deadpool & Wolverine', 533535, 2024, 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('84', 'Stockholm Bloodbath', 1051486, 2024, 'https://image.tmdb.org/t/p/w500/tzXOB8nxO70SfSbOhrYcY94x6MI.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('85', 'Thunderbolts*', 986056, 2025, 'https://image.tmdb.org/t/p/w500/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('86', 'The Smashing Machine', 760329, 2025, 'https://image.tmdb.org/t/p/w500/cwwvrdYeIrARXdiv09GIO6XWK5l.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('87', 'The Conjuring: The Devil Made Me Do It', 423108, 2021, 'https://image.tmdb.org/t/p/w500/rQfX2xx8TUoNvyk892yKWNikJaM.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('88', 'Dracula: A Love Tale', 1246049, 2025, 'https://image.tmdb.org/t/p/w500/ykyRfv7JDofLxXLAwtLXaSuaFfM.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('89', 'Donde tú quieras', 1447287, 2025, 'https://image.tmdb.org/t/p/w500/32kwv7gWBcIcI9mi5h5CwwLxZVw.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('90', 'I Know What You Did Last Summer', 1083433, 2025, 'https://image.tmdb.org/t/p/w500/6BfZLQYj97NO1yD5JkSAf5vWzGj.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('91', 'Harry Potter and the Philosopher''s Stone', 671, 2001, 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('92', 'Caramelo', 1277988, 2025, 'https://image.tmdb.org/t/p/w500/c4ZEAah5a01cu27w7vT2IAoFogk.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('93', 'Get Fast', 1369679, 2024, 'https://image.tmdb.org/t/p/w500/tDpTR7xhHu9cz1X4JAIRFwXyf6U.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('94', 'A Minecraft Movie', 950387, 2025, 'https://image.tmdb.org/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('95', 'Coco', 354912, 2017, 'https://image.tmdb.org/t/p/w500/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('96', 'The Balloonist', 1100800, 2025, 'https://image.tmdb.org/t/p/w500/fWX6kEdSWYfyTqqiJW2uzn47Lsd.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('98', 'Kaiju No. 8: Mission Recon', 1326106, 2025, 'https://image.tmdb.org/t/p/w500/2mU8qUbYKlHBdmDDbCmKLuqXd1m.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('99', 'Oh, Hi!', 1339658, 2025, 'https://image.tmdb.org/t/p/w500/8nBOFo78pKgzLipgGZhC8VA33wp.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('100', 'Kalakal', 1476292, 2025, 'https://image.tmdb.org/t/p/w500/KwhyuZn24FOs4Dl52g9KLpS48a.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('101', 'Eenie Meanie', 1151334, 2025, 'https://image.tmdb.org/t/p/w500/12Va3oO3oYUdOd75zM57Nx1976a.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('102', 'A Working Man', 1197306, 2025, 'https://image.tmdb.org/t/p/w500/6FRFIogh3zFnVWn7Z6zcYnIbRcX.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('103', 'Avengers: Infinity War', 299536, 2018, 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('104', 'The Substance', 933260, 2024, 'https://image.tmdb.org/t/p/w500/lqoMzCcZYEFK729d6qzt349fB4o.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('105', 'The Dark Knight', 155, 2008, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('106', 'Love Untangled', 1355666, 2025, 'https://image.tmdb.org/t/p/w500/e7jStO2xfBUAUK37LbINHd1qtgy.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('107', 'Legends of the Condor Heroes: The Gallants', 1185528, 2025, 'https://image.tmdb.org/t/p/w500/fUCFEGFlMIFet9ja72JDAeG1he8.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('108', 'V/H/S/HALLOWEEN', 1373445, 2025, 'https://image.tmdb.org/t/p/w500/kdZUnzXVhVFAw5uQnRhHCi8iBW.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('109', 'Avatar: Fire and Ash', 83533, 2025, 'https://image.tmdb.org/t/p/w500/5bxrxnRaxZooBAxgUVBZ13dpzC7.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('110', 'Inside Out 2', 1022789, 2024, 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('111', 'Night Carnage', 986206, 2025, 'https://image.tmdb.org/t/p/w500/w0wjPQKhlqisSbylf1sWZiNyc2h.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('112', 'Heads of State', 749170, 2025, 'https://image.tmdb.org/t/p/w500/lVgE5oLzf7ABmzyASEVcjYyHI41.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('113', 'The Gorge', 950396, 2025, 'https://image.tmdb.org/t/p/w500/7iMBZzVZtG0oBug4TfqDb9ZxAOa.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('114', '365 Days: This Day', 829557, 2022, 'https://image.tmdb.org/t/p/w500/7qU0SOVcQ8BTJLodcAlulUAG16C.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('115', 'The Shawshank Redemption', 278, 1994, 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('116', 'The Accountant²', 870028, 2025, 'https://image.tmdb.org/t/p/w500/lUvfTcOZiK0sdcX0WNLPbMyKjGm.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('117', 'The Good Luck', 1432635, 2025, 'https://image.tmdb.org/t/p/w500/4ISZRw31m60IkOnWhu2eIKf06uT.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('118', 'The Godfather', 238, 1972, 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('119', 'Detective Dee: The Four Heavenly Kings', 506763, 2018, 'https://image.tmdb.org/t/p/w500/nZ3XTA5ZlGOj92jRBSYglW8r9QY.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('120', 'Swiped', 1265344, 2025, 'https://image.tmdb.org/t/p/w500/mEeFRU5ADkyP7JtOFFV8tYMm3zD.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('121', 'The Conjuring 2', 259693, 2016, 'https://image.tmdb.org/t/p/w500/zEqyD0SBt6HL7W9JQoWwtd5Do1T.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('122', 'Demon Slayer -Kimetsu no Yaiba- The Movie: Mugen Train', 635302, 2020, 'https://image.tmdb.org/t/p/w500/h8Rb9gBr48ODIwYUttZNYeMWeUU.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('97', 'Smurfs', 936108, 2025, 'https://image.tmdb.org/t/p/w500/8o6lkhL32xQJeB52IIG1us5BVey.jpg', 2277595);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('83', 'Bring Her Back', 1151031, 2025, 'https://image.tmdb.org/t/p/w500/1Q3GlCXGYWELifxANYZ5OVMRVZl.jpg', 304958);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('123', 'Spermageddon', 1064307, 2025, 'https://image.tmdb.org/t/p/w500/n7SFxle8CVzMXzfV8GNCXqdg78m.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('124', 'Coraline', 14836, 2009, 'https://image.tmdb.org/t/p/w500/4jeFXQYytChdZYE9JYO7Un87IlW.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('125', 'Sonic the Hedgehog 3', 939243, 2024, 'https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('126', 'Despicable Me 4', 519182, 2024, 'https://image.tmdb.org/t/p/w500/wWba3TaojhK7NdycRhoQpsG0FaH.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('127', 'The Wrong Paris', 1321439, 2025, 'https://image.tmdb.org/t/p/w500/A0KRoR842OgNByCfw9iFHbWoeR9.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('128', 'The Ritual', 1278950, 2025, 'https://image.tmdb.org/t/p/w500/uubL8yvtEBjz3V7DFQHjCuSQO8w.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('129', 'My Freaky Family', 974397, 2024, 'https://image.tmdb.org/t/p/w500/h34lkT2CFufYuzmP0CEgn4lghyY.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('130', 'The Hacienda: Return of the Damned', 1354441, 2025, 'https://image.tmdb.org/t/p/w500/vXUfuM7tPvAL8HjjnsFO4yYbKUs.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('131', 'The Hobbit: The Battle of the Five Armies', 122917, 2014, 'https://image.tmdb.org/t/p/w500/xT98tLqatZPQApyRmlPL12LtiWp.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('132', 'The Nightmare Before Christmas', 9479, 1993, 'https://image.tmdb.org/t/p/w500/oQffRNjK8e19rF7xVYEN8ew0j7b.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('133', 'Porn in the Hood', 123229, 2012, 'https://image.tmdb.org/t/p/w500/cUW7NUzXJbvsZyM0LAAo5ftgov6.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('134', 'Avatar', 19995, 2009, 'https://image.tmdb.org/t/p/w500/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276147', 'Grand Prix of Europe', 1316147, 2025, 'https://image.tmdb.org/t/p/w500/2xtDoGfUtPhaH3nBmdIpM5YjfrK.jpg', 2277580);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277125', 'The Roses', 1267905, 2025, 'https://image.tmdb.org/t/p/w500/98n5HnCJ5LnXKIMNP9SBfVNyxCE.jpg', 2277541);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277009', 'Köln 75', 1171153, 2025, 'https://image.tmdb.org/t/p/w500/eSpCTFaSqQ9D52bw85zAMseM7hW.jpg', 2277622);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277110', 'Princess Mononoke', 128, 1997, 'https://image.tmdb.org/t/p/w500/cMYCDADoLKLbB83g4WnJegaZimC.jpg', 2277530);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276051', 'The More Loving One', 1223594, 2025, 'https://image.tmdb.org/t/p/w500/tBysWUglKLEa1TWbnto07Lm3Wzg.jpg', 304978);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276898', 'Summer Is Crazy', 1223589, 2025, 'https://image.tmdb.org/t/p/w500/d8Nz8ARYzX9pZ32VAg1OSjaQTgH.jpg', 2277608);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277841', 'Final Destination Bloodlines', 574475, 2025, 'https://image.tmdb.org/t/p/w500/6WxhEvFsauuACfv8HyoVX6mZKFj.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276154', 'Tango Gaúcho', 1453399, 2025, 'https://image.tmdb.org/t/p/w500/mdUwZNynN7puajJdaXYtKR5RDWH.jpg', 2277588);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277085', 'Ricky Rapper and the Double', 1262762, 2025, 'https://image.tmdb.org/t/p/w500/qUfL9XogeuHLOHak8dZ4oZnkROW.jpg', 2277592);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('8', 'Demon Slayer: Kimetsu no Yaiba Infinity Castle', 1311031, 2025, 'https://image.tmdb.org/t/p/w500/sUsVimPdA1l162FvdBIlmKBlWHx.jpg', 2277554);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('38', 'The Bad Guys 2', 1175942, 2025, 'https://image.tmdb.org/t/p/w500/c1msaKf1wyuKcmLjjJd6rIBPFcd.jpg', 2277596);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276997', 'Eagles of the Republic', 1220566, 2025, 'https://image.tmdb.org/t/p/w500/b46cbfCnTKc0JXMFhizMTw4Efxh.jpg', 2276997);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276853', 'Eddington', 648878, 2025, 'https://image.tmdb.org/t/p/w500/4GIqZUgPZ146BhibsPHMHef2nXX.jpg', 2276853);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277790', 'Gabby''s Dollhouse: The Movie', 1280282, 2025, 'https://image.tmdb.org/t/p/w500/t6LLguAmu6iZUN8pWhT7Q0IcaQ5.jpg', 2277691);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277561', 'Toy Story', 862, 1995, 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', 2277561);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277836', 'The Lord of the Rings: The Fellowship of the Ring', 120, 2001, 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277799', 'Ella and Friends – Operation Otter', 1223591, 2025, 'https://image.tmdb.org/t/p/w500/setNa9DnceeXmzmSV5OddHqqWMs.jpg', 2277577);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277544', 'Tunne turvassa - harjoituksia kehomieliyhteyden vahvistamiseksi', 1545449, 2025, 'https://image.tmdb.org/t/p/w500/4rZxnRWVzT82j2i9tw2LYPBrBlF.jpg', 2277544);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277590', 'Kantara: Chapter 1', 1083637, 2025, 'https://image.tmdb.org/t/p/w500/oT20LsaDI9Db5vBxrJrk7GQYbGN.jpg', 2277590);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277837', 'Harry Potter and the Goblet of Fire', 674, 2005, 'https://image.tmdb.org/t/p/w500/fECBtHlr0RB3foNHDiCBXeg9Bv9.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2275957', 'Täydelliset vieraat', 1262756, 2025, 'https://image.tmdb.org/t/p/w500/ziyivFbqpgwfcQvAI6JYh9J7q9V.jpg', 2277603);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('305150', 'Paris Opera Ballet: GISELLE', 1535764, 2025, 'https://image.tmdb.org/t/p/w500/5nTNT2dP83RHvWZ3zCWOhhH3FtM.jpg', 305150);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('305146', 'Royal Ballet & Opera 2025/26: La Fille mal gardée', 1483671, 2025, 'https://image.tmdb.org/t/p/w500/2utCl1bUm8JYDLHUmSsKerjTINV.jpg', 305146);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('305147', 'Royal Ballet & Opera 2025/26: The Nutcracker', 1483678, 2025, 'https://image.tmdb.org/t/p/w500/dKfjjTLVyMcZNNSok0EkNNr6AEK.jpg', 305147);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('305148', 'Royal Ballet & Opera 2024/25: Cinderella', 1296927, 2024, 'https://image.tmdb.org/t/p/w500/yFrwKLTet7W3FI94BNCWEGhGOvo.jpg', 305148);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277838', 'Kung Fu Panda 4', 1011985, 2024, 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276040', 'Downton Abbey: The Grand Finale', 1289936, 2025, 'https://image.tmdb.org/t/p/w500/m1tLlMTCwc6oK6OjWTOI4b32wnA.jpg', 2277615);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277835', 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe', 411, 2005, 'https://image.tmdb.org/t/p/w500/iREd0rNCjYdf5Ar0vfaW32yrkm.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277839', 'Harry Potter and the Chamber of Secrets', 672, 2002, 'https://image.tmdb.org/t/p/w500/sdEOH0992YZ0QSxgXNIGLq1ToUi.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277840', 'Living in Two Houses', 1362833, 2022, 'https://image.tmdb.org/t/p/w500/iXYv7Ok8qjcHclSB6Fcq1bwQAbt.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2275937', 'Cancel', 1445189, 2025, 'https://image.tmdb.org/t/p/w500/8urrmVjXjclsnKOCFbHL5i1wI8t.jpg', 2277527);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276700', 'The Phoenician Scheme', 1137350, 2025, 'https://image.tmdb.org/t/p/w500/u2jxeYLXTYfu0bqJmnLGIgZswib.jpg', 2277593);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276105', 'Relay', 1088166, 2025, 'https://image.tmdb.org/t/p/w500/mpwccO2L8LUVtVTJTdgUVgoQqAo.jpg', 2277792);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2275942', 'Fleak', 680770, 2025, 'https://image.tmdb.org/t/p/w500/xfTB0HLxD1mwoFTHWhQrxJI1Q5n.jpg', 2277534);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276977', 'The Last Viking', 1295400, 2025, 'https://image.tmdb.org/t/p/w500/oviGe0fRUQn6dTqqCqRzMJ1RoSF.jpg', 2277609);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('76', 'The Long Walk', 604079, 2025, 'https://image.tmdb.org/t/p/w500/wobVTa99eW0ht6c1rNNzLkazPtR.jpg', 2277522);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276124', 'Palava maa', 1167765, 2025, 'https://image.tmdb.org/t/p/w500/eVDIB49fjQAHNz5squgsL87MWnU.jpg', 2277571);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2275933', 'Materialists', 1136867, 2025, 'https://image.tmdb.org/t/p/w500/eDo0pNruy0Qgj6BdTyHIR4cxHY8.jpg', 2277611);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276047', 'A Light That Never Goes Out', 1304527, 2025, 'https://image.tmdb.org/t/p/w500/oTuudvTMi9c2oPcCBervo2OwVyX.jpg', 2277547);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277080', 'Possession', 21484, 1981, 'https://image.tmdb.org/t/p/w500/lUFZsUuJ0YyhBXH8D2BFUd6wODm.jpg', 2277591);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277148', 'Spinal Tap II: The End Continues', 975225, 2025, 'https://image.tmdb.org/t/p/w500/h6DGrDHlDm6gVOiy3YeOb737jB4.jpg', 2277602);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2276684', 'FLOW', 1281775, 2024, NULL, 2277632);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277834', 'A Big Bold Beautiful Journey', 1241921, 2025, 'https://image.tmdb.org/t/p/w500/dYm4Ah0UAgBHkYEPZIhuhkzl6ue.jpg', 305041);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277842', 'Fast X', 385687, 2023, 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277843', 'The Maze Runner', 198663, 2014, 'https://image.tmdb.org/t/p/w500/ode14q7WtDugFDp78fo9lCsmay9.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277844', 'Clown in a Cornfield', 713364, 2025, 'https://image.tmdb.org/t/p/w500/bghFYMUMEKK6GyTHRA7XVC8uWn6.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277845', 'The Home', 926606, 2025, 'https://image.tmdb.org/t/p/w500/v8oSjAv37tWWzPlk2YfvZz55F9Z.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277846', 'Adulthood', 1083420, 2025, 'https://image.tmdb.org/t/p/w500/a40Gi0Zq4Ecqu3obmOp6TSgEne1.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277847', 'American Sweatshop', 1215020, 2025, 'https://image.tmdb.org/t/p/w500/zUXz9LHeU82S3n2pJhiEifOOei5.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277848', 'Dead Again', 1466120, 2025, 'https://image.tmdb.org/t/p/w500/iqSmb9ugb8xK6avZ3Wglxue39N8.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277849', 'The Batman', 414906, 2022, 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277850', 'Gone Girl', 210577, 2014, 'https://image.tmdb.org/t/p/w500/ts996lKsxvjkO2yiYG0ht4qAicO.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277851', 'Se7en', 807, 1995, 'https://image.tmdb.org/t/p/w500/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277852', 'Psycho', 539, 1960, 'https://image.tmdb.org/t/p/w500/yz4QVqPx3h1hD1DfqqQkCq3rmxW.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277853', 'Rockstar: DUKI from the End of the World', 1546933, 2025, 'https://image.tmdb.org/t/p/w500/9CSTzX1pUrNLD7lsJ8h9hRFJtLQ.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277854', 'Unknown Number: The High School Catfish', 1517772, 2025, 'https://image.tmdb.org/t/p/w500/nu3LtgefE2lsgYw1hxHZFoBXk9U.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277855', 'Van Gogh by Vincent', 1471014, 2025, 'https://image.tmdb.org/t/p/w500/z73X4WKZghBh5fri31o8P6vBEB2.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277856', 'That''s Roman Porno: Smile of Goddesses', 687637, 1988, 'https://image.tmdb.org/t/p/w500/4Pg5MgKLaALu7ZRxWi0h4AK4Zx3.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277857', 'Raiders!: The Story of the Greatest Fan Film Ever Made', 329697, 2015, 'https://image.tmdb.org/t/p/w500/kaFbT76lzFpPhwX3vHWEgNGSgkU.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277858', 'Exorcismo: The Transgressive Legacy of Clasificada ''S''', 1304681, 2024, 'https://image.tmdb.org/t/p/w500/uZentdoTuGZ1sqwn4EMPfWaRsgO.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277859', 'HOMECOMING: A film by Beyoncé', 593691, 2019, 'https://image.tmdb.org/t/p/w500/nKdP4K3Bj3qnjtDCq9lTg7UOHVy.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277860', 'Bambi: A Tale of Life in the Woods', 1094473, 2024, 'https://image.tmdb.org/t/p/w500/vWNVHtwOhcoOEUSrY1iHRGbgH8O.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277861', 'The Figo Affair: The Transfer That Changed Football', 1014779, 2022, 'https://image.tmdb.org/t/p/w500/cmUmwFRrgQguSPPut2SYzwNEQEY.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277862', 'Marvel Studios Assembled: The Making of Moon Knight', 964943, 2022, 'https://image.tmdb.org/t/p/w500/dM6Y4uLzeF4rqbmKBzR0wAsTxby.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277863', 'Ozzy: No Escape from Now', 1508191, 2025, 'https://image.tmdb.org/t/p/w500/7xlmn0xpEYiqGN7bINAbEUjNqbr.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277864', 'swingers ZwingerZ', 939099, 2022, 'https://image.tmdb.org/t/p/w500/lemo5hfG4w7Sm9mKjiIGmJ3hkYB.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277865', 'Untold: Sign Stealer', 1324989, 2024, 'https://image.tmdb.org/t/p/w500/f9smYB0Pqfe1QZwjBCbieAAFsDN.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277866', 'Inferno Rosso: Joe D''Amato on the Road of Excess', 862868, 2021, 'https://image.tmdb.org/t/p/w500/8wTHGhKga3Jxy7xDhx6PyeA2IH5.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277867', 'Rhythm + Flow France: After the Beat', 1556160, 2025, 'https://image.tmdb.org/t/p/w500/7M9g0Ua0YlSJDq4IPIpAyuoq5HV.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277868', 'After Truth: Disinformation and the Cost of Fake News', 680438, 2020, 'https://image.tmdb.org/t/p/w500/e0O1IMV3DtLiXtw9m8wLsazfyA9.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277869', 'Operation Varsity Blues: The College Admissions Scandal', 799555, 2021, 'https://image.tmdb.org/t/p/w500/qZJuctnatinO0OpnruGOWaT4Bga.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277870', 'Bruce Springsteen''s Letter to You', 750160, 2020, 'https://image.tmdb.org/t/p/w500/5DU0BAecmGRFnFUjXnFSpA56cA0.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277871', 'Deaf President Now!', 1400288, 2025, 'https://image.tmdb.org/t/p/w500/hbTq1jfuGtLo1pdAY0gcbJcCWlF.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277872', 'The Devil Is Busy', 1373150, 2024, 'https://image.tmdb.org/t/p/w500/hiDLqQ0r7uH5Ww9ekpOmzFEUpxz.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277873', 'The Matrix', 603, 1999, 'https://image.tmdb.org/t/p/w500/p96dm7sCMn4VYAStA6siNz30G1r.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277874', 'Gold Rush Gang', 1429739, 2025, 'https://image.tmdb.org/t/p/w500/7j6jZNhCTnsZy5QItpruDwyBWoo.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277875', 'No Country for Old Men', 6977, 2007, 'https://image.tmdb.org/t/p/w500/6d5XOczc226jECq0LIX0siKtgHR.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277876', 'Django Unchained', 68718, 2012, 'https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277877', 'The Good, the Bad and the Ugly', 429, 1966, 'https://image.tmdb.org/t/p/w500/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277878', 'Redeeming Love', 698508, 2022, 'https://image.tmdb.org/t/p/w500/pDc2HxQtC0MlKD4QfRvmKREEyhc.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277879', 'Rust', 710258, 2025, 'https://image.tmdb.org/t/p/w500/tbJ3RkA2s6X5qrBzrYHYTxvDBui.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277880', 'Red Coat', 75630, 1975, 'https://image.tmdb.org/t/p/w500/4XJQG5ylc7NIW8mh4joQpzBPgRq.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277881', 'Killing Faith', 1200320, 2025, 'https://image.tmdb.org/t/p/w500/1SotID63YLOSKgOb7DUfHgWo1dX.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277882', 'Once Upon a Time in the West', 335, 1968, 'https://image.tmdb.org/t/p/w500/qbYgqOczabWNn2XKwgMtVrntD6P.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277883', 'The Magnificent Seven', 333484, 2016, 'https://image.tmdb.org/t/p/w500/ezcS78TIjgr85pVdaPDd2rSPVNs.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277884', 'Showdown at Boot Hill', 73821, 1958, 'https://image.tmdb.org/t/p/w500/lJ1vrJbWYa65MopMb1UjPLGOAKG.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277885', 'The Revenant', 281957, 2015, 'https://image.tmdb.org/t/p/w500/ji3ecJphATlVgWNY0B0RVXZizdf.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277886', 'Black God, White Devil', 67612, 1964, 'https://image.tmdb.org/t/p/w500/keNDV8nbgVLiCUyzObisEDxdAI4.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277887', 'The Thicket', 395817, 2024, 'https://image.tmdb.org/t/p/w500/jsvk8e0HgITFX0gbDEjj6hOytsP.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277888', 'Guns for San Sebastian', 67659, 1968, 'https://image.tmdb.org/t/p/w500/2vxVQVdYD25o7oAdp7HQBDZ5Y6K.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277889', 'Four Guns to the Border', 245305, 1954, 'https://image.tmdb.org/t/p/w500/eLGNjQOdVDSJEZ0QDf5WDimbtv7.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277890', 'Dust', 16405, 2001, 'https://image.tmdb.org/t/p/w500/qhNlFTwlrte13wX3ntMQJSO7azG.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277891', 'Rango', 44896, 2011, 'https://image.tmdb.org/t/p/w500/A5MP1guV8pbruieG0tnpPIbaJtt.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277892', 'Vidaamuyarchi', 949716, 2025, 'https://image.tmdb.org/t/p/w500/yx7AYFLoupzBfdfEAlDFuOiei2A.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277893', 'St. Vierja Academy', 1167828, 2023, 'https://image.tmdb.org/t/p/w500/qNKFJ8YoOffJedQWAZUVTrz512H.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277894', 'The Woman in the Line', 1193861, 2025, 'https://image.tmdb.org/t/p/w500/n1PPU08b3ltuVhL7Dd5A8TMMR7t.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277895', 'Corpse Bride', 3933, 2005, 'https://image.tmdb.org/t/p/w500/isb2Qow76GpqYmsSyfdMfsYAjts.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277896', 'Gunman', 1450529, 2025, 'https://image.tmdb.org/t/p/w500/eBw5Vso0K3r8Dzycxz0E0lgC40z.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277897', 'Kulli: The Power Of Devil', 1179904, NULL, 'https://image.tmdb.org/t/p/w500/yQYhmXuGJyRBahQoSgUbDX7ejSd.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277898', 'Jari', 732436, 1979, 'https://image.tmdb.org/t/p/w500/b4pNJ6YA117bnIhb1ymHSEKBCr2.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277899', 'The Woman in Cabin 10', 1290879, 2025, 'https://image.tmdb.org/t/p/w500/bq4vm4ADTQUffXjDFedaHMiIROM.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277900', 'In the Sub for Love', 1096638, 2024, 'https://image.tmdb.org/t/p/w500/8AgHsphAafmNANTKdBQfKmgGbhi.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277901', 'Creation of the Gods II: Demon Force', 1155281, 2025, 'https://image.tmdb.org/t/p/w500/dfUCs5HNtGu4fofh83uiE2Qcy3v.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277902', 'Schindler''s List', 424, 1993, 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277903', 'Dongji Rescue', 1305653, 2025, 'https://image.tmdb.org/t/p/w500/1eb3YebyscUmXmrrC2ZDDVR0w0P.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277904', 'Warfare', 1241436, 2025, 'https://image.tmdb.org/t/p/w500/srj9rYrjefyWqkLc6l2xjTGeBGO.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277905', 'The Partisan', 1159939, 2025, 'https://image.tmdb.org/t/p/w500/a6AMhzCY0vlnO9KSbawvGg7c2y.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277906', 'Inglourious Basterds', 16869, 2009, 'https://image.tmdb.org/t/p/w500/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277907', 'Fury', 228150, 2014, 'https://image.tmdb.org/t/p/w500/pfte7wdMobMF4CVHuOxyu6oqeeA.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277908', 'Troy', 652, 2004, 'https://image.tmdb.org/t/p/w500/a07wLy4ONfpsjnBqMwhlWTJTcm.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277909', 'The Ministry of Ungentlemanly Warfare', 799583, 2024, 'https://image.tmdb.org/t/p/w500/8aF0iAKH9MJMYAZdi0Slg77RYa2.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277910', 'Hacksaw Ridge', 324786, 2016, 'https://image.tmdb.org/t/p/w500/wuz8TjCIWR2EVVMuEfBnQ1vuGS3.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277911', 'Civil War', 929590, 2024, 'https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277912', 'A House of Dynamite', 1290159, 2025, 'https://image.tmdb.org/t/p/w500/AiJ8L90ftPAwVf3SDx7Fj9IMZoy.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277913', 'Murder Company', 1285247, 2024, 'https://image.tmdb.org/t/p/w500/eUjzUUFm1dEUR6U4r0C6s9L2FEd.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277914', 'The Zone of Interest', 467244, 2023, 'https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277915', 'Land of Bad', 969492, 2024, 'https://image.tmdb.org/t/p/w500/h3jYanWMEJq6JJsCopy1h7cT2Hs.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277916', 'Harami', 741397, 2021, 'https://image.tmdb.org/t/p/w500/5fLd31wBLZWbPYbDvfJrwR3l9l2.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277917', 'The Family Plan', 1029575, 2023, 'https://image.tmdb.org/t/p/w500/jLLtx3nTRSLGPAKl4RoIv1FbEBr.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277918', 'The Wild Robot', 1184918, 2024, 'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277919', 'Vicious', 1251717, 2025, 'https://image.tmdb.org/t/p/w500/shKGDGrwqmc9x2aTJcQszoXinq0.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277920', 'The Lord of the Rings: The Return of the King', 122, 2003, 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277921', 'Motherland', 1223422, 2025, 'https://image.tmdb.org/t/p/w500/rE2UnEr9m8iLeuvWxaQyaNDKTHU.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277922', 'Swim to Me', 1484640, 2025, 'https://image.tmdb.org/t/p/w500/5pkYUOyvxjAYlUpq4GDTp04gxMa.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277923', 'Bajo un volcán', 1310879, 2025, 'https://image.tmdb.org/t/p/w500/8joWkrzM7ss1t8JZlBffavbg4hg.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277924', 'No Tears in Hell', 1512581, 2025, 'https://image.tmdb.org/t/p/w500/a0bODl3Ieix1qcGRLIx6PZvluzB.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277925', 'Gypsy Moon', 1549457, 2024, 'https://image.tmdb.org/t/p/w500/6jehxNC3pAk5S2a9ZeadumjCP33.jpg', NULL);
INSERT INTO "public"."movies" ("id", "original_title", "tmdb_id", "release_year", "poster_url", "f_id") VALUES ('2277926', 'War 2', 1109086, 2025, 'https://image.tmdb.org/t/p/w500/tHUEGjexjpTDO3ggla9JQ6CojxU.jpg', NULL);
INSERT INTO "public"."reviews" ("id", "movie_id", "user_id", "rating", "content", "created_at", "updated_at") VALUES (65, 1038392, 6, 4, 'Solid', '2025-10-14 12:20:55.57528', NULL);
INSERT INTO "public"."reviews" ("id", "movie_id", "user_id", "rating", "content", "created_at", "updated_at") VALUES (66, 1311031, 1, 3, 'YES!', '2025-10-14 16:22:08.296804', NULL);
INSERT INTO "public"."tags" ("group_id", "genre_id") VALUES (70, 16);
INSERT INTO "public"."tags" ("group_id", "genre_id") VALUES (71, 16);
INSERT INTO "public"."tags" ("group_id", "genre_id") VALUES (72, 12);
INSERT INTO "public"."users" ("id", "email", "username", "password_hash", "account_type_id", "real_name", "created_at", "last_activity_at", "updated_at", "user_bio", "date_of_birth") VALUES (2, 'ba@zroot.it', 'banana', '$2b$12$hqvRFeYZP2IUOZbEvejYfOGM.MDeBytvKnFoUECntCYO44Go6wa5.', 1, NULL, '2025-10-13 19:11:35.127461+00', NULL, NULL, NULL, NULL);
INSERT INTO "public"."users" ("id", "email", "username", "password_hash", "account_type_id", "real_name", "created_at", "last_activity_at", "updated_at", "user_bio", "date_of_birth") VALUES (5, 'testi@testi.fi', 'testi', '$2b$12$wno1eip674ORaq3Ss2y5W.XE4PIdQP9v7oJfsJkq7VHWbbR2ReI5S', 1, NULL, '2025-10-13 19:37:04.148647+00', NULL, NULL, NULL, NULL);
INSERT INTO "public"."users" ("id", "email", "username", "password_hash", "account_type_id", "real_name", "created_at", "last_activity_at", "updated_at", "user_bio", "date_of_birth") VALUES (7, 'otto@movietok.fi', 'Otto', '$2b$12$rP3IFAjLXUxInpqWpC5LcO.QMgeef0lCCbbG8Zco9sCgEh6clNCam', 1, NULL, '2025-10-14 12:38:30.528708+00', NULL, NULL, NULL, NULL);
INSERT INTO "public"."users" ("id", "email", "username", "password_hash", "account_type_id", "real_name", "created_at", "last_activity_at", "updated_at", "user_bio", "date_of_birth") VALUES (8, 't@t', 'TestoTestaaja', '$2b$12$8UmFZIGpGQhXfVmWzoU1d.10yCleox6b29Cz6oI2EKx3pel7DPR9e', 1, NULL, '2025-10-14 16:41:24.619807+00', NULL, NULL, NULL, NULL);
INSERT INTO "public"."users" ("id", "email", "username", "password_hash", "account_type_id", "real_name", "created_at", "last_activity_at", "updated_at", "user_bio", "date_of_birth") VALUES (6, 's@m.it', 'SamppaLHT', '$2b$12$XBxyWcdXZFcBMujyQyW7ce166S/8S9eQUz5OzaxR3QdZbLocbfLGC', 1, NULL, '2025-10-14 12:18:17.728625+00', NULL, '2025-10-14 16:50:41.468991+00', 'test', NULL);
INSERT INTO "public"."users" ("id", "email", "username", "password_hash", "account_type_id", "real_name", "created_at", "last_activity_at", "updated_at", "user_bio", "date_of_birth") VALUES (1, 'roope@mt.fi', 'Roopettaja', '$2b$12$Fj6DLWJsJItQ.tefu.Knwez2oerodPkxik3QG/mQrL/MAlJv9Zj1q', 1, NULL, '2025-10-13 19:10:08.020454+00', NULL, '2025-10-14 16:52:09.353794+00', 'Meikä on Roope!', NULL);
INSERT INTO "public"."users" ("id", "email", "username", "password_hash", "account_type_id", "real_name", "created_at", "last_activity_at", "updated_at", "user_bio", "date_of_birth") VALUES (9, 'Liisa@mt.fi', 'Liisa', '$2b$12$tNi3tKeylC36Ob8tME18pe/o6U3MTWuBdXaGDtErKsN0xPVlBi1Li', 1, NULL, '2025-10-14 17:15:57.98427+00', NULL, '2025-10-14 17:16:53.419075+00', 'Mä oon Liisa!', NULL);
ALTER TABLE "public"."favorites" ENABLE TRIGGER ALL;
ALTER TABLE "public"."genres" ENABLE TRIGGER ALL;
ALTER TABLE "public"."group_members" ENABLE TRIGGER ALL;
ALTER TABLE "public"."group_themes" ENABLE TRIGGER ALL;
ALTER TABLE "public"."groups" ENABLE TRIGGER ALL;
ALTER TABLE "public"."interactions" ENABLE TRIGGER ALL;
ALTER TABLE "public"."movies" ENABLE TRIGGER ALL;
ALTER TABLE "public"."reviews" ENABLE TRIGGER ALL;
ALTER TABLE "public"."tags" ENABLE TRIGGER ALL;
ALTER TABLE "public"."user_roles" ENABLE TRIGGER ALL;
ALTER TABLE "public"."users" ENABLE TRIGGER ALL;
ALTER TABLE "public"."favorites" ADD CONSTRAINT "tmdb_id" FOREIGN KEY ("tmdb_id") REFERENCES "public"."movies" ("tmdb_id");
ALTER TABLE "public"."favorites" ADD CONSTRAINT "group_id" FOREIGN KEY ("group_id") REFERENCES "public"."groups" ("id");
ALTER TABLE "public"."group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups" ("id");
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "public"."group_themes" ("id");
ALTER TABLE "public"."tags" ADD CONSTRAINT "genre_id" FOREIGN KEY ("genre_id") REFERENCES "public"."genres" ("id");
