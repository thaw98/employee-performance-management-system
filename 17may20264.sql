-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: epms_db
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appraisal_answers`
--

DROP TABLE IF EXISTS `appraisal_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appraisal_answers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comments` text,
  `rating` int DEFAULT NULL,
  `assignment_id` bigint NOT NULL,
  `question_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKi2uqyebfhn1lqi2nepgs8w79m` (`assignment_id`),
  KEY `FKapgw67c74ffqth2ba6llvne45` (`question_id`),
  CONSTRAINT `FKapgw67c74ffqth2ba6llvne45` FOREIGN KEY (`question_id`) REFERENCES `appraisal_questions` (`id`),
  CONSTRAINT `FKi2uqyebfhn1lqi2nepgs8w79m` FOREIGN KEY (`assignment_id`) REFERENCES `appraisal_assignments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_answers`
--

LOCK TABLES `appraisal_answers` WRITE;
/*!40000 ALTER TABLE `appraisal_answers` DISABLE KEYS */;
INSERT INTO `appraisal_answers` VALUES (1,'',5,1,1),(2,'',10,1,2),(3,'',10,1,3),(4,'',5,1,4),(5,'',10,1,5),(6,'',6,1,6),(7,'',8,1,7),(8,'',10,1,8),(9,'',4,1,9),(10,'',10,1,10),(11,'',5,1,11),(12,'',10,1,12),(13,'',7,1,13),(14,'',10,1,14),(15,'',8,1,15),(16,'',10,1,16),(17,'',9,1,17),(18,'',10,2,1),(19,'',5,2,2),(20,'',10,2,3),(21,'',5,2,4),(22,'',5,2,5),(23,'',10,2,6),(24,'',5,2,7),(25,'',5,2,8),(26,'',10,2,9),(27,'',9,2,10),(28,'',8,2,11),(29,'',9,2,12),(30,'',6,2,13),(31,'',9,2,14),(32,'',8,2,15),(33,'',9,2,16),(34,'',3,2,17);
/*!40000 ALTER TABLE `appraisal_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appraisal_assignments`
--

DROP TABLE IF EXISTS `appraisal_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appraisal_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `hr_comments` text,
  `hr_signature` text,
  `hr_signed_at` datetime(6) DEFAULT NULL,
  `rating_category` varchar(255) DEFAULT NULL,
  `status` enum('DRAFT','HR_APPROVED','LOCKED','PENDING_MANAGER','REJECTED','RETURNED','SUBMITTED') NOT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `total_score` double DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `period_id` bigint DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `evaluator_id` bigint DEFAULT NULL,
  `manager_comments` text,
  `manager_signature` text,
  `manager_signed_at` datetime(6) DEFAULT NULL,
  `template_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgqrsy0eet8yn2617lv1j33hsp` (`employee_id`),
  KEY `FK6s4w0ryspgw7q27yiy8q6p4wl` (`period_id`),
  KEY `FKtkvj87jsoei045f0ceted3vi` (`evaluator_id`),
  KEY `FK5a1s0xj8u479yieg9yv4m5gay` (`template_id`),
  CONSTRAINT `FK5a1s0xj8u479yieg9yv4m5gay` FOREIGN KEY (`template_id`) REFERENCES `appraisal_templates` (`id`),
  CONSTRAINT `FK6s4w0ryspgw7q27yiy8q6p4wl` FOREIGN KEY (`period_id`) REFERENCES `appraisal_cycle` (`cycle_id`),
  CONSTRAINT `FKgqrsy0eet8yn2617lv1j33hsp` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKtkvj87jsoei045f0ceted3vi` FOREIGN KEY (`evaluator_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_assignments`
--

LOCK TABLES `appraisal_assignments` WRITE;
/*!40000 ALTER TABLE `appraisal_assignments` DISABLE KEYS */;
INSERT INTO `appraisal_assignments` VALUES (1,'2026-05-16 12:44:09.688235','HR comment test',NULL,NULL,'GOOD','REJECTED','2026-05-16 14:18:16.689099',80.58823529411765,'2026-05-16 14:22:23.543567',5,3,2,29,'overall very good','/uploads/signatures/ba2c218b-7d67-4d96-87b9-ccc81a914226.png','2026-05-16 14:18:16.689099',1),(2,'2026-05-16 12:44:09.721623','','/uploads/signatures/71448cfb-389f-41bf-a788-c67b42f4b25d.png','2026-05-17 09:08:39.978860','AVERAGE','HR_APPROVED','2026-05-17 09:08:18.861922',74.11764705882354,'2026-05-17 09:08:39.978860',6,3,2,29,'Lisa Wong is good','/uploads/signatures/ba2c218b-7d67-4d96-87b9-ccc81a914226.png','2026-05-17 09:08:18.861922',1),(3,'2026-05-16 12:44:09.728304',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.728304',7,3,0,29,NULL,NULL,NULL,1),(4,'2026-05-16 12:44:09.736196',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.736196',13,3,0,29,NULL,NULL,NULL,1),(5,'2026-05-16 12:44:09.742772',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.742772',16,3,0,29,NULL,NULL,NULL,1),(6,'2026-05-16 12:44:09.764041',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.764041',17,3,0,29,NULL,NULL,NULL,1),(7,'2026-05-16 12:44:09.773595',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.773595',19,3,0,29,NULL,NULL,NULL,1),(8,'2026-05-16 12:44:09.782567',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.782567',21,3,0,29,NULL,NULL,NULL,1),(9,'2026-05-16 12:44:09.787032',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.787032',23,3,0,29,NULL,NULL,NULL,1),(10,'2026-05-16 12:44:09.791571',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.791571',33,3,0,29,NULL,NULL,NULL,1),(11,'2026-05-16 12:44:09.797505',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.797505',36,3,0,29,NULL,NULL,NULL,1),(12,'2026-05-16 12:44:09.803540',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.803540',38,3,0,29,NULL,NULL,NULL,1),(13,'2026-05-16 12:44:09.808229',NULL,NULL,NULL,NULL,'PENDING_MANAGER',NULL,NULL,'2026-05-16 12:44:09.808229',124,3,0,29,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `appraisal_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appraisal_categories`
--

DROP TABLE IF EXISTS `appraisal_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appraisal_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` bit(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sort_order` int DEFAULT NULL,
  `is_finalized` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_categories`
--

LOCK TABLES `appraisal_categories` WRITE;
/*!40000 ALTER TABLE `appraisal_categories` DISABLE KEYS */;
INSERT INTO `appraisal_categories` VALUES (1,'Job Knowledge/Technical Skills','Evaluation of job knowledge and technical competence.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary ''),(2,'Accountability','Evaluation of commitment, initiative, and responsibility at work.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary ''),(3,'Problem Solving & Supervision','Evaluation of problem solving ability and supervision effectiveness.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary ''),(4,'Innovative','Evaluation of originality, creativity, and innovation.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary ''),(5,'Team Work','Evaluation of teamwork, collaboration, and information sharing.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary '\0'),(6,'Quality Work','Evaluation of work quality, standards, and process improvement.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary '\0'),(7,'Loyalty','Evaluation of trustworthiness, responsibility, and willingness to take responsibility.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary '\0'),(8,'Attendance/Rule and Regulations/Compliance','Evaluation of attendance, rules, regulations, and compliance.',_binary '','2026-04-20 06:56:18','2026-05-16 12:41:40',NULL,_binary '\0');
/*!40000 ALTER TABLE `appraisal_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appraisal_cycle`
--

DROP TABLE IF EXISTS `appraisal_cycle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appraisal_cycle` (
  `cycle_id` bigint NOT NULL AUTO_INCREMENT,
  `end_date` date DEFAULT NULL,
  `cycle_name` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`cycle_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_cycle`
--

LOCK TABLES `appraisal_cycle` WRITE;
/*!40000 ALTER TABLE `appraisal_cycle` DISABLE KEYS */;
INSERT INTO `appraisal_cycle` VALUES (1,'2026-12-31','Annual 2026','2026-01-01','Active'),(2,'2026-03-31','Q1 2026','2026-01-01','Active'),(3,'2026-06-30','Q2 2026','2026-04-01','Active');
/*!40000 ALTER TABLE `appraisal_cycle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appraisal_questions`
--

DROP TABLE IF EXISTS `appraisal_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appraisal_questions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint NOT NULL,
  `question_text` text NOT NULL,
  `answer_type` varchar(255) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '1',
  `status` bit(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_appraisal_questions_category` (`category_id`),
  CONSTRAINT `fk_appraisal_questions_category` FOREIGN KEY (`category_id`) REFERENCES `appraisal_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_questions`
--

LOCK TABLES `appraisal_questions` WRITE;
/*!40000 ALTER TABLE `appraisal_questions` DISABLE KEYS */;
INSERT INTO `appraisal_questions` VALUES (1,1,'Process relevant knowledge of work','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(2,1,'Knowledge/technical competence/skill in the area of specialization.','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(3,1,'Accomplish the Personal Business Objectives.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(4,2,'Committed to work.','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(5,2,'Plans and organizes work effectively.','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(6,2,'Proactive and takes initiative.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(7,2,'Has a sense of urgency in acting on work matters','textarea',1,4,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(8,2,'Willing to Learn.','textarea',1,5,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(9,3,'Helps resolve staff problems related to work.','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(10,3,'Handles problem situations effectively','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(11,3,'Is a positive role model for other staff.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(12,3,'Effectively supervises the work of subordinates','textarea',1,4,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(13,3,'Develops team members','textarea',1,5,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(14,4,'Shows originality and creativity in thinking','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(15,4,'Meets challenges with resourcefulness.','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(16,4,'Generates suggestions for improving work.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(17,4,'Develops innovative approaches and ideas.','textarea',1,4,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(18,5,'Able to work independently.','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(19,5,'Willing to work with others in a team.','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(20,5,'Share information and/or skills with colleague.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(21,6,'Understands the company\'s norms','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(22,6,'Is accurate, thorough and careful with work performed.','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(23,6,'Sustain the company\'s quality.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(24,6,'Seeks to continually improve processes and work methods.','textarea',1,4,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(25,7,'Able to work with minimum supervision.','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(26,7,'Is trustworthy, responsible, and reliable','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(27,7,'Is willing to accept new responsibilities.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(28,8,'Has good attendance.','textarea',1,1,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(29,8,'Observation of office\'s rule and regulation.','textarea',1,2,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18'),(30,8,'Meets all compliance requirements without deductions.','textarea',1,3,_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18');
/*!40000 ALTER TABLE `appraisal_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appraisal_templates`
--

DROP TABLE IF EXISTS `appraisal_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appraisal_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assessment_date` date DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `max_rating` int DEFAULT NULL,
  `deadline_date` date DEFAULT NULL,
  `review_cycle_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_templates`
--

LOCK TABLES `appraisal_templates` WRITE;
/*!40000 ALTER TABLE `appraisal_templates` DISABLE KEYS */;
INSERT INTO `appraisal_templates` VALUES (1,'2026-05-16','2026-05-16','2026-05-16',_binary '','Appraisal Form 2026',10,'2026-06-16',NULL);
/*!40000 ALTER TABLE `appraisal_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_id` bigint NOT NULL AUTO_INCREMENT,
  `action_type` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text NOT NULL,
  `metadata_json` json DEFAULT NULL,
  `before_data` longtext,
  `after_data` longtext,
  `performed_by_role_id` bigint DEFAULT NULL,
  `performed_by_user_id` bigint DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `target_type` varchar(100) NOT NULL,
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=194 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 03:42:17.825238','HR user 2 created employee account for employee_id 13 with role_id 4','{\"employeeId\": 13, \"userAccountId\": 13}',NULL,NULL,1,2,13,'EMPLOYEE'),(2,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 03:56:37.658280','Employee user_account_id 13 completed first-login password change',NULL,NULL,NULL,4,13,13,'USER_ACCOUNT'),(3,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 04:39:47.923768','HR user 2 created employee account for employee_id 14 with role_id 4','{\"employeeId\": 14, \"userAccountId\": 14}',NULL,NULL,1,2,14,'EMPLOYEE'),(4,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 04:40:39.999341','Employee user_account_id 14 completed first-login password change',NULL,NULL,NULL,4,14,14,'USER_ACCOUNT'),(5,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 04:47:22.240913','HR user 2 created employee account for employee_id 15 with role_id 4','{\"employeeId\": 15, \"userAccountId\": 15}',NULL,NULL,1,2,15,'EMPLOYEE'),(6,'TEMP_PASSWORD_RESENT','2026-04-20 04:47:35.017456','HR user 2 resent temporary password for user_account_id 15',NULL,NULL,NULL,1,2,15,'USER_ACCOUNT'),(7,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 05:07:48.306199','HR user 2 created employee account for employee_id 16 with role_id 4','{\"employeeId\": 16, \"userAccountId\": 16}',NULL,NULL,1,2,16,'EMPLOYEE'),(8,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 05:11:17.824186','Employee user_account_id 16 completed first-login password change',NULL,NULL,NULL,4,16,16,'USER_ACCOUNT'),(9,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 05:25:29.199513','HR user 2 created employee account for employee_id 17 with role_id 4','{\"employeeId\": 17, \"userAccountId\": 17}',NULL,NULL,1,2,17,'EMPLOYEE'),(10,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 05:26:08.560741','Employee user_account_id 17 completed first-login password change',NULL,NULL,NULL,4,17,17,'USER_ACCOUNT'),(11,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 05:34:52.999906','HR user 2 created employee account for employee_id 18 with role_id 4','{\"employeeId\": 18, \"userAccountId\": 18}',NULL,NULL,1,2,18,'EMPLOYEE'),(12,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 05:35:27.583836','Employee user_account_id 18 completed first-login password change',NULL,NULL,NULL,4,18,18,'USER_ACCOUNT'),(13,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 07:42:35.287155','HR user 2 created employee account for employee_id 19 with role_id 4','{\"employeeId\": 19, \"userAccountId\": 19}',NULL,NULL,1,2,19,'EMPLOYEE'),(14,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 07:43:23.986470','Employee user_account_id 19 completed first-login password change',NULL,NULL,NULL,4,19,19,'USER_ACCOUNT'),(15,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 07:54:04.285681','HR user 2 created employee account for employee_id 20 with role_id 4','{\"employeeId\": 20, \"userAccountId\": 20}',NULL,NULL,1,2,20,'EMPLOYEE'),(16,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 07:54:45.252219','Employee user_account_id 20 completed first-login password change',NULL,NULL,NULL,4,20,20,'USER_ACCOUNT'),(17,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 14:47:18.341903','HR user 2 created employee account for employee_id 21 with role_id 4','{\"employeeId\": 21, \"userAccountId\": 21}',NULL,NULL,1,2,21,'EMPLOYEE'),(18,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-21 14:49:48.970098','Employee user_account_id 21 completed first-login password change',NULL,NULL,NULL,4,21,21,'USER_ACCOUNT'),(19,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 16:01:22.335108','HR user 2 created employee account for employee_id 22 with role_id 4','{\"employeeId\": 22, \"userAccountId\": 22}',NULL,NULL,1,2,22,'EMPLOYEE'),(20,'TEMP_PASSWORD_RESENT','2026-04-21 16:02:38.277222','HR user resent temporary password for user_account_id 22',NULL,NULL,NULL,1,2,22,'USER_ACCOUNT'),(21,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-21 16:04:15.064929','Employee user_account_id 22 completed first-login password change',NULL,NULL,NULL,4,22,22,'USER_ACCOUNT'),(22,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 16:50:50.235829','HR user 2 created employee account for employee_id 23 with role_id 4','{\"employeeId\": 23, \"userAccountId\": 23}',NULL,NULL,1,2,23,'EMPLOYEE'),(26,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 19:35:40.774263','HR user 2 created employee account for employee_id 27 with role_id 4','{\"employeeId\": 27, \"userAccountId\": 27}',NULL,NULL,1,2,27,'EMPLOYEE'),(27,'EDIT_EMPLOYEE_INFO','2026-04-21 21:02:32.523826','HR user updated employee info for employee_id 19',NULL,NULL,NULL,1,2,19,'EMPLOYEE'),(29,'EMPLOYEE_ACCOUNT_CREATED','2026-04-22 03:04:09.254063','HR user 2 created employee account for employee_id 29 with role_id 4','{\"employeeId\": 29, \"userAccountId\": 29}',NULL,NULL,1,2,29,'EMPLOYEE'),(30,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-22 03:05:23.256035','Employee user_account_id 29 completed first-login password change',NULL,NULL,NULL,4,29,29,'USER_ACCOUNT'),(33,'EMPLOYEE_INITIAL_MOVEMENT','2026-04-23 06:10:19.247321','Initial movement history created for employee_id 32','{\"toPositionId\": 3, \"toDepartmentId\": 2, \"movementHistoryId\": 2}',NULL,NULL,1,2,32,'EMPLOYEE'),(34,'EMPLOYEE_ACCOUNT_CREATED','2026-04-23 06:10:19.473009','HR user 2 created employee account for employee_id 32 with role_id 3','{\"employeeId\": 32, \"userAccountId\": 31}',NULL,NULL,1,2,32,'EMPLOYEE'),(35,'EMPLOYEE_BULK_IMPORT','2026-04-23 09:38:33.807785','HR user 2 committed import session b1290871-1333-4977-b699-2aea1b9932c8: 2 imported, 0 failed','{\"fileName\": \"employee_import_template (22).xlsx\", \"failedCount\": 0, \"validationId\": \"b1290871-1333-4977-b699-2aea1b9932c8\", \"importedCount\": 2}',NULL,NULL,1,2,3,'EMPLOYEE'),(36,'EMPLOYEE_INITIAL_MOVEMENT','2026-04-23 14:32:08.495885','Initial movement history created for employee_id 36','{\"toPositionId\": 4, \"toDepartmentId\": 2, \"movementHistoryId\": 3}',NULL,NULL,1,2,36,'EMPLOYEE'),(37,'EMPLOYEE_ACCOUNT_CREATED','2026-04-23 14:32:08.637831','HR user 2 created employee account for employee_id 36 with role_id 4','{\"employeeId\": 36, \"userAccountId\": 35}',NULL,NULL,1,2,36,'EMPLOYEE'),(38,'EMPLOYEE_INITIAL_MOVEMENT','2026-04-23 17:37:09.746787','Initial movement history created for employee_id 37','{\"toPositionId\": 3, \"toDepartmentId\": 2, \"movementHistoryId\": 4}',NULL,NULL,1,2,37,'EMPLOYEE'),(39,'EMPLOYEE_ACCOUNT_CREATED','2026-04-23 17:37:09.893228','HR user 2 created employee account for employee_id 37 with role_id 3','{\"employeeId\": 37, \"userAccountId\": 36}',NULL,NULL,1,2,37,'EMPLOYEE'),(40,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-23 17:37:39.702214','Employee user_account_id 36 completed first-login password change',NULL,NULL,NULL,3,36,36,'USER_ACCOUNT'),(41,'EMPLOYEE_BULK_IMPORT','2026-04-23 17:39:27.694850','HR user 2 committed import session cea6bd29-1640-4ff6-8131-b9e5553737ea: 1 imported, 0 failed','{\"fileName\": \"employee_import_template (23).xlsx\", \"failedCount\": 0, \"validationId\": \"cea6bd29-1640-4ff6-8131-b9e5553737ea\", \"importedCount\": 1}',NULL,NULL,1,2,6,'EMPLOYEE'),(42,'EMPLOYMENT_STATUS_UPDATED','2026-04-25 11:24:26.838419','HR updated employment status to RESIGNED for employee_id 38',NULL,NULL,NULL,1,2,38,'EMPLOYEE'),(43,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-25 11:25:37.599885','Employee user_account_id 37 completed first-login password change',NULL,NULL,NULL,4,37,37,'USER_ACCOUNT'),(44,'EMPLOYMENT_STATUS_UPDATED','2026-04-28 09:08:38.423126','HR updated employment status to PERMANENT for employee_id 36',NULL,NULL,NULL,1,2,36,'EMPLOYEE'),(45,'EMPLOYMENT_STATUS_UPDATED','2026-04-28 09:08:41.578752','HR updated employment status to PERMANENT for employee_id 33',NULL,NULL,NULL,1,2,33,'EMPLOYEE'),(46,'EMPLOYMENT_STATUS_UPDATED','2026-04-28 09:08:45.476814','HR updated employment status to PERMANENT for employee_id 29',NULL,NULL,NULL,1,2,29,'EMPLOYEE'),(47,'EMPLOYMENT_STATUS_UPDATED','2026-04-28 09:09:06.362321','HR updated employment status to PERMANENT for employee_id 38',NULL,NULL,NULL,1,2,38,'EMPLOYEE'),(48,'EMPLOYEE_INITIAL_TRANSFER','2026-04-29 07:33:25.640764','Initial transfer history created for employee_id 39','{\"toPositionId\": 5, \"toDepartmentId\": 3, \"transferHistoryId\": 5}',NULL,NULL,1,2,39,'EMPLOYEE'),(49,'EMPLOYEE_ACCOUNT_CREATED','2026-04-29 07:33:25.790023','HR user 2 created employee account for employee_id 39 with role_id 4','{\"employeeId\": 39, \"userAccountId\": 38}',NULL,NULL,1,2,39,'EMPLOYEE'),(50,'EMPLOYMENT_STATUS_UPDATED','2026-04-29 10:16:52.501509','HR updated employment status to PERMANENT for employee_id 21',NULL,NULL,NULL,1,2,21,'EMPLOYEE'),(51,'QUESTION_BANK_CREATED','2026-05-01 14:35:56.643269','Created question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(52,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:35:58.275215','Deactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(53,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:35:59.075687','Reactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(54,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:35:59.893255','Deactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(55,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:36:00.325366','Reactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(56,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:36:02.665109','Deactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(57,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:36:04.360714','Reactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(58,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:36:04.797559','Deactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(59,'QUESTION_BANK_STATUS_CHANGED','2026-05-01 14:36:05.217096','Reactivated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(60,'QUESTION_BANK_UPDATED','2026-05-01 14:36:23.656335','Updated question bank item',NULL,NULL,NULL,1,2,1,'QUESTION_BANK'),(61,'QUESTION_BANK_CREATED','2026-05-01 16:41:56.931811','Created question bank item',NULL,NULL,NULL,1,2,2,'QUESTION_BANK'),(62,'QUESTION_BANK_CREATED','2026-05-01 16:42:01.318744','Created question bank item',NULL,NULL,NULL,1,2,3,'QUESTION_BANK'),(63,'QUESTION_BANK_CREATED','2026-05-01 16:42:05.936892','Created question bank item',NULL,NULL,NULL,1,2,4,'QUESTION_BANK'),(64,'QUESTION_BANK_CREATED','2026-05-01 16:42:11.410470','Created question bank item',NULL,NULL,NULL,1,2,5,'QUESTION_BANK'),(65,'QUESTION_BANK_CREATED','2026-05-01 16:42:16.377203','Created question bank item',NULL,NULL,NULL,1,2,6,'QUESTION_BANK'),(66,'QUESTION_BANK_CREATED','2026-05-01 16:42:22.050703','Created question bank item',NULL,NULL,NULL,1,2,7,'QUESTION_BANK'),(67,'QUESTION_BANK_CREATED','2026-05-01 16:42:28.537591','Created question bank item',NULL,NULL,NULL,1,2,8,'QUESTION_BANK'),(68,'QUESTION_BANK_CREATED','2026-05-01 16:42:35.104549','Created question bank item',NULL,NULL,NULL,1,2,9,'QUESTION_BANK'),(69,'QUESTION_BANK_CREATED','2026-05-01 16:42:53.267009','Created question bank item',NULL,NULL,NULL,1,2,10,'QUESTION_BANK'),(70,'QUESTION_BANK_UPDATED','2026-05-01 16:42:56.665728','Updated question bank item',NULL,NULL,NULL,1,2,9,'QUESTION_BANK'),(71,'QUESTION_BANK_UPDATED','2026-05-01 16:42:58.623271','Updated question bank item',NULL,NULL,NULL,1,2,8,'QUESTION_BANK'),(72,'QUESTION_BANK_UPDATED','2026-05-01 16:43:01.620500','Updated question bank item',NULL,NULL,NULL,1,2,7,'QUESTION_BANK'),(73,'QUESTION_BANK_UPDATED','2026-05-01 16:43:04.381495','Updated question bank item',NULL,NULL,NULL,1,2,6,'QUESTION_BANK'),(74,'QUESTION_BANK_UPDATED','2026-05-01 16:43:17.915915','Updated question bank item',NULL,NULL,NULL,1,2,5,'QUESTION_BANK'),(75,'QUESTION_BANK_UPDATED','2026-05-01 16:43:20.925328','Updated question bank item',NULL,NULL,NULL,1,2,4,'QUESTION_BANK'),(76,'QUESTION_BANK_UPDATED','2026-05-01 16:43:22.865895','Updated question bank item',NULL,NULL,NULL,1,2,3,'QUESTION_BANK'),(77,'QUESTION_BANK_UPDATED','2026-05-01 16:43:25.291033','Updated question bank item',NULL,NULL,NULL,1,2,2,'QUESTION_BANK'),(78,'EMPLOYEE_INITIAL_TRANSFER','2026-05-01 17:53:23.517743','Initial transfer history created for employee_id 40','{\"toPositionId\": 72, \"toDepartmentId\": 2, \"transferHistoryId\": 6}',NULL,NULL,1,2,40,'EMPLOYEE'),(79,'EMPLOYEE_ACCOUNT_CREATED','2026-05-01 17:53:23.663940','HR user 2 created employee account for employee_id 40 with role_id 4','{\"employeeId\": 40, \"userAccountId\": 39}',NULL,NULL,1,2,40,'EMPLOYEE'),(80,'PASSWORD_CHANGED_FIRST_LOGIN','2026-05-01 17:53:47.569734','Employee user_account_id 39 completed first-login password change',NULL,NULL,NULL,4,39,39,'USER_ACCOUNT'),(81,'SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED','2026-05-04 05:33:11.937807','Bulk assigned self-assessment forms: created 0, skipped existing 0, skipped no template 32',NULL,NULL,NULL,NULL,2,NULL,'SELF_ASSESSMENT_FORM'),(82,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-04 08:11:20.030905','Created self-assessment form template for department Engineering and position DESIGNER',NULL,NULL,NULL,NULL,2,1,'SELF_ASSESSMENT_FORM_TEMPLATE'),(83,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-04 12:42:39.748123','Created self-assessment form template for department Engineering and position Software Engineer',NULL,NULL,NULL,NULL,2,2,'SELF_ASSESSMENT_FORM_TEMPLATE'),(84,'SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED','2026-05-04 12:45:14.823385','Bulk assigned self-assessment forms: created 2, skipped existing 0, skipped no template 0',NULL,NULL,NULL,NULL,2,NULL,'SELF_ASSESSMENT_FORM'),(85,'QUESTION_BANK_STATUS_CHANGED','2026-05-04 13:15:39.917281','Deactivated question bank item',NULL,NULL,NULL,1,2,8,'QUESTION_BANK'),(86,'QUESTION_BANK_STATUS_CHANGED','2026-05-04 13:15:40.776361','Reactivated question bank item',NULL,NULL,NULL,1,2,8,'QUESTION_BANK'),(87,'QUESTION_BANK_UPDATED','2026-05-04 13:15:42.657376','Updated question bank item',NULL,NULL,NULL,1,2,8,'QUESTION_BANK'),(88,'QUESTION_BANK_STATUS_CHANGED','2026-05-04 13:15:42.673223','Deactivated question bank item',NULL,NULL,NULL,1,2,8,'QUESTION_BANK'),(89,'QUESTION_BANK_STATUS_CHANGED','2026-05-04 13:15:43.950616','Reactivated question bank item',NULL,NULL,NULL,1,2,8,'QUESTION_BANK'),(90,'QUESTION_BANK_CREATED','2026-05-10 07:52:57.697683','Created question bank item',NULL,NULL,NULL,1,2,11,'QUESTION_BANK'),(91,'QUESTION_BANK_UPDATED','2026-05-10 07:53:01.693107','Updated question bank item',NULL,NULL,NULL,1,2,11,'QUESTION_BANK'),(92,'QUESTION_BANK_CREATED','2026-05-10 07:53:09.547698','Created question bank item',NULL,NULL,NULL,1,2,12,'QUESTION_BANK'),(93,'QUESTION_BANK_CREATED','2026-05-10 07:53:17.253829','Created question bank item',NULL,NULL,NULL,1,2,13,'QUESTION_BANK'),(94,'QUESTION_BANK_CREATED','2026-05-10 07:53:25.245097','Created question bank item',NULL,NULL,NULL,1,2,14,'QUESTION_BANK'),(95,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.135398','Created self-assessment form template for department Human Resources and position HR Manager',NULL,NULL,NULL,NULL,2,1,'SELF_ASSESSMENT_FORM_TEMPLATE'),(96,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.250754','Created self-assessment form template for department Operations and position Operations Manager',NULL,NULL,NULL,NULL,2,2,'SELF_ASSESSMENT_FORM_TEMPLATE'),(97,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.353323','Created self-assessment form template for department Engineering and position LEAD DESIGNER',NULL,NULL,NULL,NULL,2,3,'SELF_ASSESSMENT_FORM_TEMPLATE'),(98,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.489617','Created self-assessment form template for department Engineering and position SSE',NULL,NULL,NULL,NULL,2,4,'SELF_ASSESSMENT_FORM_TEMPLATE'),(99,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.595680','Created self-assessment form template for department Engineering and position DESIGNER',NULL,NULL,NULL,NULL,2,5,'SELF_ASSESSMENT_FORM_TEMPLATE'),(100,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.720626','Created self-assessment form template for department Sales and position SALES EXECUTIVE',NULL,NULL,NULL,NULL,2,6,'SELF_ASSESSMENT_FORM_TEMPLATE'),(101,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.801061','Created self-assessment form template for department Engineering and position TRANSLATOR',NULL,NULL,NULL,NULL,2,7,'SELF_ASSESSMENT_FORM_TEMPLATE'),(102,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.884516','Created self-assessment form template for department Finance and position JUNIOR FINANCE OFFICER',NULL,NULL,NULL,NULL,2,8,'SELF_ASSESSMENT_FORM_TEMPLATE'),(103,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:37.968728','Created self-assessment form template for department Customer Service and position CALL CENTER OFFICER',NULL,NULL,NULL,NULL,2,9,'SELF_ASSESSMENT_FORM_TEMPLATE'),(104,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.052786','Created self-assessment form template for department Quality Assurance and position OJT',NULL,NULL,NULL,NULL,2,10,'SELF_ASSESSMENT_FORM_TEMPLATE'),(105,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.131390','Created self-assessment form template for department Security and position DRIVERS',NULL,NULL,NULL,NULL,2,11,'SELF_ASSESSMENT_FORM_TEMPLATE'),(106,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.199655','Created self-assessment form template for department Administration and position CLEANERS',NULL,NULL,NULL,NULL,2,12,'SELF_ASSESSMENT_FORM_TEMPLATE'),(107,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.279862','Created self-assessment form template for department Security and position SECURITY',NULL,NULL,NULL,NULL,2,13,'SELF_ASSESSMENT_FORM_TEMPLATE'),(108,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.366248','Created self-assessment form template for department Marketing and position MARKETING HEAD',NULL,NULL,NULL,NULL,2,14,'SELF_ASSESSMENT_FORM_TEMPLATE'),(109,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.450918','Created self-assessment form template for department Finance and position Finance Manager',NULL,NULL,NULL,NULL,2,15,'SELF_ASSESSMENT_FORM_TEMPLATE'),(110,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.512504','Created self-assessment form template for department Sales and position SALES HEAD',NULL,NULL,NULL,NULL,2,16,'SELF_ASSESSMENT_FORM_TEMPLATE'),(111,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.572123','Created self-assessment form template for department Information Technology and position PROJECT MANAGER',NULL,NULL,NULL,NULL,2,17,'SELF_ASSESSMENT_FORM_TEMPLATE'),(112,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.652209','Created self-assessment form template for department Legal and position CORPORATE LAWYER',NULL,NULL,NULL,NULL,2,18,'SELF_ASSESSMENT_FORM_TEMPLATE'),(113,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.740173','Created self-assessment form template for department Customer Service and position CALL CENTER SUPERVISOR',NULL,NULL,NULL,NULL,2,19,'SELF_ASSESSMENT_FORM_TEMPLATE'),(114,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.821309','Created self-assessment form template for department Research & Development and position PRODUCT HEAD',NULL,NULL,NULL,NULL,2,20,'SELF_ASSESSMENT_FORM_TEMPLATE'),(115,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.891705','Created self-assessment form template for department Procurement and position PS HEAD',NULL,NULL,NULL,NULL,2,21,'SELF_ASSESSMENT_FORM_TEMPLATE'),(116,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:38.950637','Created self-assessment form template for department Administration and position SENIOR ADMIN OFFICER',NULL,NULL,NULL,NULL,2,22,'SELF_ASSESSMENT_FORM_TEMPLATE'),(117,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.015159','Created self-assessment form template for department Engineering and position GENERAL MANAGER',NULL,NULL,NULL,NULL,2,23,'SELF_ASSESSMENT_FORM_TEMPLATE'),(118,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.062904','Created self-assessment form template for department Engineering and position Team Lead',NULL,NULL,NULL,NULL,2,24,'SELF_ASSESSMENT_FORM_TEMPLATE'),(119,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.112192','Created self-assessment form template for department Finance and position Accountant',NULL,NULL,NULL,NULL,2,25,'SELF_ASSESSMENT_FORM_TEMPLATE'),(120,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.167307','Created self-assessment form template for department Engineering and position Software Engineer',NULL,NULL,NULL,NULL,2,26,'SELF_ASSESSMENT_FORM_TEMPLATE'),(121,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.219615','Created self-assessment form template for department Finance and position SENIOR FINANCE OFFICER',NULL,NULL,NULL,NULL,2,27,'SELF_ASSESSMENT_FORM_TEMPLATE'),(122,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.277978','Created self-assessment form template for department Operations and position OM HEAD',NULL,NULL,NULL,NULL,2,28,'SELF_ASSESSMENT_FORM_TEMPLATE'),(123,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.326420','Created self-assessment form template for department Sales and position SALES ADMIN',NULL,NULL,NULL,NULL,2,29,'SELF_ASSESSMENT_FORM_TEMPLATE'),(124,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.385787','Created self-assessment form template for department Human Resources and position Executive Director',NULL,NULL,NULL,NULL,2,30,'SELF_ASSESSMENT_FORM_TEMPLATE'),(125,'SELF_ASSESSMENT_FORM_TEMPLATE_CREATED','2026-05-10 10:25:39.442423','Created self-assessment form template for department Human Resources and position EXTERNAL CONSULTANTS',NULL,NULL,NULL,NULL,2,31,'SELF_ASSESSMENT_FORM_TEMPLATE'),(126,'EMPLOYEE_INITIAL_TRANSFER','2026-05-11 06:56:38.826853','Initial transfer history created for employee_id 124','{\"toPositionId\": 4, \"toDepartmentId\": 2, \"transferHistoryId\": 90}',NULL,NULL,1,2,124,'EMPLOYEE'),(127,'EMPLOYEE_ACCOUNT_CREATED','2026-05-11 06:56:38.959953','HR user 2 created employee account for employee_id 124 with role_id 4','{\"employeeId\": 124, \"userAccountId\": 124}',NULL,NULL,1,2,124,'EMPLOYEE'),(128,'PASSWORD_CHANGED_FIRST_LOGIN','2026-05-11 06:57:55.677063','Employee user_account_id 124 completed first-login password change',NULL,NULL,NULL,4,124,124,'USER_ACCOUNT'),(129,'SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED','2026-05-11 08:31:37.265369','Bulk assigned self-assessment forms: created 8, skipped existing 0, skipped no template 0, skipped ineligible 0',NULL,NULL,NULL,NULL,2,NULL,'SELF_ASSESSMENT_FORM'),(130,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 08:34:47.529191','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(131,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 08:34:50.280185','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(132,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 12:37:27.222749','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(133,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 12:37:47.624223','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(134,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 12:37:50.198821','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(135,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 12:37:57.811390','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(136,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 12:38:03.044229','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(138,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-11 13:00:47.911664','Submitted self-assessment form with score 100.0',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(139,'SELF_ASSESSMENT_FORM_MANAGER_ADJUSTMENT_PROPOSED','2026-05-11 13:42:26.295866','Manager proposed adjustments for self-assessment form',NULL,NULL,NULL,NULL,29,5,'SELF_ASSESSMENT_FORM'),(140,'SELF_ASSESSMENT_FORM_MANAGER_REVIEWED','2026-05-11 13:42:26.302892','Manager reviewed self-assessment form',NULL,NULL,NULL,NULL,29,5,'SELF_ASSESSMENT_FORM'),(141,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-11 13:45:00.015690','Employee acknowledged manager review',NULL,NULL,NULL,NULL,124,5,'SELF_ASSESSMENT_FORM'),(142,'SELF_ASSESSMENT_FORM_HR_APPROVED','2026-05-11 13:53:42.696502','HR finalized self-assessment form. Final score: 91.42857142857143',NULL,NULL,NULL,NULL,2,5,'SELF_ASSESSMENT_FORM'),(143,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 15:51:44.429182','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,42,1,'SELF_ASSESSMENT_FORM'),(144,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-11 15:51:54.923621','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,42,1,'SELF_ASSESSMENT_FORM'),(145,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-12 19:22:38.291808','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(146,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:38:45.403646','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(147,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:38:48.298201','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(148,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:38:53.152110','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(149,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:39:03.343374','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(150,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:39:06.164936','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(151,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:39:13.537170','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(152,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:39:16.843192','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(153,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:39:28.773257','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(154,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 10:39:58.190572','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(155,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-13 10:40:07.927833','Submitted self-assessment form with score 77.14285714285715',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(156,'SELF_ASSESSMENT_FORM_MANAGER_REVIEWED','2026-05-13 10:47:48.270189','Manager reviewed self-assessment form',NULL,NULL,NULL,NULL,29,4,'SELF_ASSESSMENT_FORM'),(157,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-13 13:24:56.326478','Employee acknowledged manager review',NULL,NULL,NULL,NULL,94,4,'SELF_ASSESSMENT_FORM'),(158,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 13:26:03.234035','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,47,8,'SELF_ASSESSMENT_FORM'),(159,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 13:26:23.709171','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,47,8,'SELF_ASSESSMENT_FORM'),(160,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 13:26:46.326141','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,47,8,'SELF_ASSESSMENT_FORM'),(161,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-13 13:26:55.367497','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,47,8,'SELF_ASSESSMENT_FORM'),(162,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-13 13:27:02.051608','Submitted self-assessment form with score 74.28571428571429',NULL,NULL,NULL,NULL,47,8,'SELF_ASSESSMENT_FORM'),(163,'SELF_ASSESSMENT_FORM_MANAGER_REVIEWED','2026-05-13 13:27:41.726921','Manager reviewed self-assessment form',NULL,NULL,NULL,NULL,29,8,'SELF_ASSESSMENT_FORM'),(164,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-13 13:27:41.732916','Employee acknowledgment skipped: manager made no score adjustments; pending HR final approval',NULL,NULL,NULL,NULL,29,8,'SELF_ASSESSMENT_FORM'),(165,'SELF_ASSESSMENT_FORM_HR_APPROVED','2026-05-13 13:28:22.885686','HR finalized self-assessment form. Final score: 74.28571428571429',NULL,NULL,NULL,NULL,2,8,'SELF_ASSESSMENT_FORM'),(166,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-16 08:44:38.710327','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,42,1,'SELF_ASSESSMENT_FORM'),(167,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-16 08:44:49.738817','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,42,1,'SELF_ASSESSMENT_FORM'),(168,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-16 08:45:06.518607','Submitted self-assessment form with score 62.857142857142854',NULL,NULL,NULL,NULL,42,1,'SELF_ASSESSMENT_FORM'),(169,'SELF_ASSESSMENT_FORM_MANAGER_ADJUSTMENT_PROPOSED','2026-05-16 08:55:19.520081','Manager proposed adjustments for self-assessment form',NULL,NULL,NULL,NULL,29,1,'SELF_ASSESSMENT_FORM'),(170,'SELF_ASSESSMENT_FORM_MANAGER_REVIEWED','2026-05-16 08:55:19.525370','Manager reviewed self-assessment form',NULL,NULL,NULL,NULL,29,1,'SELF_ASSESSMENT_FORM'),(171,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-16 08:56:03.617670','Employee disputed manager review',NULL,NULL,NULL,NULL,42,1,'SELF_ASSESSMENT_FORM'),(172,'SELF_ASSESSMENT_FORM_HR_SENT_BACK_TO_MANAGER','2026-05-16 08:56:45.123403','HR returned disputed manager review to manager. Reason: Please revise again.',NULL,NULL,NULL,NULL,2,1,'SELF_ASSESSMENT_FORM'),(173,'SELF_ASSESSMENT_FORM_MANAGER_ADJUSTMENT_PROPOSED','2026-05-16 09:45:44.104005','Manager proposed adjustments for self-assessment form',NULL,NULL,NULL,NULL,29,1,'SELF_ASSESSMENT_FORM'),(174,'SELF_ASSESSMENT_FORM_MANAGER_REVIEWED','2026-05-16 09:45:44.128742','Manager reviewed self-assessment form',NULL,NULL,NULL,NULL,29,1,'SELF_ASSESSMENT_FORM'),(175,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-16 09:47:58.707706','Employee acknowledged manager review',NULL,NULL,NULL,NULL,42,1,'SELF_ASSESSMENT_FORM'),(176,'SELF_ASSESSMENT_FORM_HR_APPROVED','2026-05-16 09:48:10.843913','HR finalized self-assessment form. Final score: 57.14285714285714',NULL,NULL,NULL,NULL,2,1,'SELF_ASSESSMENT_FORM'),(177,'SUBMIT_EVALUATION','2026-05-16 14:18:16.748831','Manager submitted evaluation for employee ID: 5',NULL,NULL,NULL,2,29,1,'AppraisalAssignment'),(178,'REJECT','2026-05-16 14:22:23.543567','HR Rejected appraisal for employee ID: 5',NULL,NULL,NULL,1,2,1,'AppraisalAssignment'),(179,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-16 14:44:19.504472','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,5,7,'SELF_ASSESSMENT_FORM'),(180,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-16 14:44:30.275412','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,5,7,'SELF_ASSESSMENT_FORM'),(181,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-16 14:48:34.864660','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,5,7,'SELF_ASSESSMENT_FORM'),(182,'SELF_ASSESSMENT_FORM_DRAFT_SAVED','2026-05-16 14:48:46.375671','Saved draft for self-assessment form',NULL,NULL,NULL,NULL,5,7,'SELF_ASSESSMENT_FORM'),(183,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-16 15:07:56.721284','Submitted self-assessment form with score 100.0',NULL,NULL,NULL,NULL,5,7,'SELF_ASSESSMENT_FORM'),(184,'SELF_ASSESSMENT_FORM_HR_APPROVED','2026-05-16 16:02:47.661388','HR finalized self-assessment form. Final score: 77.14285714285715',NULL,NULL,NULL,NULL,2,4,'SELF_ASSESSMENT_FORM'),(185,'SELF_ASSESSMENT_FORM_MANAGER_ADJUSTMENT_PROPOSED','2026-05-16 16:32:53.991466','Manager proposed adjustments for self-assessment form',NULL,NULL,NULL,NULL,29,7,'SELF_ASSESSMENT_FORM'),(186,'SELF_ASSESSMENT_FORM_MANAGER_REVIEWED','2026-05-16 16:32:53.991466','Manager reviewed self-assessment form',NULL,NULL,NULL,NULL,29,7,'SELF_ASSESSMENT_FORM'),(187,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-16 16:34:03.120839','Employee disputed manager review',NULL,NULL,NULL,NULL,5,7,'SELF_ASSESSMENT_FORM'),(188,'SELF_ASSESSMENT_FORM_HR_REJECTED_ADJUSTMENT','2026-05-16 16:52:25.710396','HR rejected manager adjustments. Reason: Adjustment inconsistent with employee self-rating',NULL,NULL,NULL,NULL,2,7,'SELF_ASSESSMENT_FORM'),(189,'SELF_ASSESSMENT_FORM_MANAGER_ADJUSTMENT_PROPOSED','2026-05-16 16:53:25.348754','Manager proposed adjustments for self-assessment form',NULL,NULL,NULL,NULL,29,7,'SELF_ASSESSMENT_FORM'),(190,'SELF_ASSESSMENT_FORM_MANAGER_REVIEWED','2026-05-16 16:53:25.356144','Manager reviewed self-assessment form',NULL,NULL,NULL,NULL,29,7,'SELF_ASSESSMENT_FORM'),(191,'SELF_ASSESSMENT_FORM_SUBMITTED','2026-05-16 16:54:33.097790','Employee acknowledged manager review',NULL,NULL,NULL,NULL,5,7,'SELF_ASSESSMENT_FORM'),(192,'SUBMIT_EVALUATION','2026-05-17 09:08:18.963663','Manager submitted evaluation for employee ID: 6',NULL,NULL,NULL,2,29,2,'AppraisalAssignment'),(193,'APPROVE','2026-05-17 09:08:39.982425','HR Approved appraisal for employee ID: 6',NULL,NULL,NULL,1,2,2,'AppraisalAssignment');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `copied_self_assessment_form_template`
--

DROP TABLE IF EXISTS `copied_self_assessment_form_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `copied_self_assessment_form_template` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint NOT NULL,
  `created_on` datetime(6) NOT NULL,
  `rating_system` enum('FIVE_POINT','TEN_POINT') NOT NULL,
  `title` varchar(255) NOT NULL,
  `source_template_id` bigint NOT NULL,
  `department_id` bigint DEFAULT NULL,
  `position_id` bigint DEFAULT NULL,
  `ten_point_yes_min_rating` int NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKclvn9tgna260boagov7b7p2kv` (`created_by`),
  KEY `FK6ysas4fcr91b53nhlx3x2yvri` (`source_template_id`),
  CONSTRAINT `FK6ysas4fcr91b53nhlx3x2yvri` FOREIGN KEY (`source_template_id`) REFERENCES `self_assessment_form_template` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `copied_self_assessment_form_template`
--

LOCK TABLES `copied_self_assessment_form_template` WRITE;
/*!40000 ALTER TABLE `copied_self_assessment_form_template` DISABLE KEYS */;
/*!40000 ALTER TABLE `copied_self_assessment_form_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `copied_self_assessment_form_template_question`
--

DROP TABLE IF EXISTS `copied_self_assessment_form_template_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `copied_self_assessment_form_template_question` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `deleted_by` bigint DEFAULT NULL,
  `question_text` text NOT NULL,
  `sort_order` int NOT NULL,
  `copied_template_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6up7we783n7oc9xq3kk41uuqs` (`copied_template_id`),
  CONSTRAINT `FK6up7we783n7oc9xq3kk41uuqs` FOREIGN KEY (`copied_template_id`) REFERENCES `copied_self_assessment_form_template` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `copied_self_assessment_form_template_question`
--

LOCK TABLES `copied_self_assessment_form_template_question` WRITE;
/*!40000 ALTER TABLE `copied_self_assessment_form_template_question` DISABLE KEYS */;
/*!40000 ALTER TABLE `copied_self_assessment_form_template_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department`
--

DROP TABLE IF EXISTS `department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department` (
  `department_id` bigint NOT NULL AUTO_INCREMENT,
  `department_code` varchar(20) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `department_name` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `UKtc0vggvvuqc22trtdy0dmrahh` (`department_code`),
  KEY `fk_department_manager` (`manager_id`),
  CONSTRAINT `fk_department_manager` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department`
--

LOCK TABLES `department` WRITE;
/*!40000 ALTER TABLE `department` DISABLE KEYS */;
INSERT INTO `department` VALUES (1,'HR','2026-04-18 17:04:30.000000','Human Resources','Active','2026-04-23 17:29:49.423174',NULL),(2,'ENG','2026-04-18 17:04:30.000000','Engineering','Active','2026-04-28 14:54:53.000000',29),(3,'FIN','2026-04-18 17:04:30.000000','Finance','Active','2026-04-28 08:54:54.725196',14),(4,'OPS','2026-04-18 17:04:30.000000','Operations','Active','2026-04-28 08:54:59.691238',15),(5,'MKT','2026-04-22 14:00:00.000000','Marketing','Active','2026-04-28 08:55:02.714559',13),(6,'SLS','2026-04-22 14:00:00.000000','Sales','Active','2026-04-28 08:55:12.031951',16),(7,'IT','2026-04-22 14:00:00.000000','Information Technology','Active','2026-04-28 08:55:15.313718',17),(8,'LGL','2026-04-22 14:00:00.000000','Legal','Active','2026-04-28 08:55:18.746056',18),(9,'CS','2026-04-22 14:00:00.000000','Customer Service','Active','2026-04-28 08:55:21.061376',19),(10,'RND','2026-04-22 14:00:00.000000','Research & Development','Active','2026-04-28 08:55:22.921430',20),(11,'PRC','2026-04-22 14:00:00.000000','Procurement','Active','2026-04-28 08:58:38.703333',21),(12,'QA','2026-04-22 14:00:00.000000','Quality Assurance','Active','2026-04-28 08:55:33.146837',22),(13,'ADM','2026-04-22 14:00:00.000000','Administration','Active','2026-04-28 09:00:30.380344',23),(14,'SEC','2026-04-22 14:00:00.000000','Security','Active','2026-04-28 09:00:33.564768',27);
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_kpis`
--

DROP TABLE IF EXISTS `department_kpis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_kpis` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(255) NOT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `period` varchar(255) NOT NULL,
  `record_status` varchar(255) NOT NULL,
  `target` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `weight` decimal(38,2) NOT NULL,
  `department_id` bigint NOT NULL,
  `actual` varchar(255) DEFAULT NULL,
  `score` decimal(38,2) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `weighted_score` decimal(38,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKox4rq9y0dw4rrtd3fmsetai1v` (`department_id`),
  CONSTRAINT `FKox4rq9y0dw4rrtd3fmsetai1v` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_kpis`
--

LOCK TABLES `department_kpis` WRITE;
/*!40000 ALTER TABLE `department_kpis` DISABLE KEYS */;
/*!40000 ALTER TABLE `department_kpis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_manager_history`
--

DROP TABLE IF EXISTS `department_manager_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_manager_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `department_id` bigint NOT NULL,
  `manager_employee_id` bigint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dmh_department_current` (`department_id`,`end_date`),
  KEY `idx_dmh_manager_start` (`manager_employee_id`,`start_date`),
  CONSTRAINT `fk_dmh_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`),
  CONSTRAINT `fk_dmh_manager` FOREIGN KEY (`manager_employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_manager_history`
--

LOCK TABLES `department_manager_history` WRITE;
/*!40000 ALTER TABLE `department_manager_history` DISABLE KEYS */;
INSERT INTO `department_manager_history` VALUES (1,5,13,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(2,3,14,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(3,4,15,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(4,6,16,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(5,7,17,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(6,8,18,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(7,9,19,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(8,10,20,'2026-04-20',NULL,1,'2026-05-04 11:55:36'),(9,11,21,'2026-04-21',NULL,1,'2026-05-04 11:55:36'),(10,12,22,'2026-04-21',NULL,1,'2026-05-04 11:55:36'),(11,13,23,'2026-04-21',NULL,1,'2026-05-04 11:55:36'),(12,14,27,'2026-04-21',NULL,1,'2026-05-04 11:55:36'),(13,2,29,'2026-04-22',NULL,1,'2026-05-04 11:55:36');
/*!40000 ALTER TABLE `department_manager_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_position`
--

DROP TABLE IF EXISTS `department_position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_position` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `department_id` bigint NOT NULL,
  `position_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Active',
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dept_position` (`department_id`,`position_id`),
  UNIQUE KEY `UK2unrwu2cju6ea0orjepejdn30` (`department_id`,`position_id`),
  UNIQUE KEY `uq_department_position_department_position` (`department_id`,`position_id`),
  KEY `idx_dhp_department` (`department_id`),
  KEY `idx_dhp_position` (`position_id`),
  CONSTRAINT `fk_dhp_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`),
  CONSTRAINT `fk_dhp_position` FOREIGN KEY (`position_id`) REFERENCES `position` (`position_id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_position`
--

LOCK TABLES `department_position` WRITE;
/*!40000 ALTER TABLE `department_position` DISABLE KEYS */;
INSERT INTO `department_position` VALUES (1,1,1,'Active',NULL,NULL,2,'2026-04-25 17:11:25',NULL),(2,1,2,'Active',NULL,NULL,NULL,NULL,NULL),(3,2,3,'Active',NULL,NULL,NULL,'2026-04-25 17:11:25',NULL),(4,2,4,'Active',NULL,NULL,NULL,'2026-04-25 17:11:25',NULL),(6,3,6,'Active',NULL,'2026-04-25 17:11:25',NULL,NULL,NULL),(7,3,5,'Active',NULL,'2026-04-25 17:11:25',NULL,NULL,NULL),(8,4,7,'Active',NULL,'2026-04-25 17:11:25',NULL,NULL,NULL),(14,1,64,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,3),(15,1,77,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,4),(16,1,55,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,5),(17,1,8,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,6),(18,1,54,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,7),(19,1,56,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,8),(20,1,53,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,9),(21,1,57,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,10),(22,2,71,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,5),(23,2,70,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,6),(24,2,72,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,7),(25,2,68,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,8),(26,2,56,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,9),(27,3,63,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,3),(28,3,76,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,4),(29,3,56,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,5),(30,4,61,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,2),(31,4,56,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,3),(32,5,62,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(33,6,59,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(34,6,73,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,2),(35,6,74,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,3),(36,7,68,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(37,8,66,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(38,9,69,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(39,9,79,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,2),(40,10,60,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(41,11,58,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(42,12,80,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(43,13,65,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(44,13,78,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,2),(45,14,83,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,1),(46,14,81,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,2),(47,14,82,'Active',NULL,'2026-04-27 15:20:01',NULL,NULL,3);
/*!40000 ALTER TABLE `department_position` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emergency_contact`
--

DROP TABLE IF EXISTS `emergency_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergency_contact` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `employee_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtoyey9u8x1mc48k4labhfhew7` (`employee_id`),
  CONSTRAINT `FKtoyey9u8x1mc48k4labhfhew7` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergency_contact`
--

LOCK TABLES `emergency_contact` WRITE;
/*!40000 ALTER TABLE `emergency_contact` DISABLE KEYS */;
INSERT INTO `emergency_contact` VALUES (1,'095894165845','Father',14),(2,'0952658485','Mother',15),(3,'09512651420','Mother',16),(4,'0941548512','Father',17),(5,'09512525415','Mother',18),(6,'0951258412','Father',NULL),(7,'095265431535','Father',NULL),(8,'0951284712','Wife',NULL),(9,'0951564578','Father',NULL),(10,'0985466516','Parent',NULL),(14,'0914851656','Spouse',NULL),(16,'0915474562','Father',NULL),(19,'0958415841','Mother',NULL),(20,'095087532','Father',NULL),(21,'095186583','Uncle',NULL),(23,'09512525415','Spouse',NULL),(24,'0951258412','Father',NULL),(25,'095087532','Father',NULL),(26,'0954151541815','Spouse',NULL),(27,'095125658415','Parents',NULL),(28,'09512345678','Father',41),(29,'09512345678','Father',NULL),(30,'09512345678','Father',42),(31,'09523456789','Mother',43),(32,'09534567890','Spouse',44),(33,'09545678901','Father',45),(34,'09556789012','Mother',46),(35,'09567890123','Brother',47),(36,'09578901234','Sister',48),(37,'09589012345','Father',49),(38,'09590123456','Mother',50),(39,'09501234567','Spouse',51),(40,'09511223344','Father',52),(41,'09522334455','Mother',53),(42,'09533445566','Brother',54),(43,'09544556677','Sister',55),(44,'09555667788','Father',56),(45,'09566778899','Mother',57),(46,'09577889900','Spouse',58),(47,'09588990011','Father',59),(48,'09599001122','Mother',60),(49,'09500112233','Brother',61),(50,'09521436587','Sister',62),(51,'09532547698','Father',63),(52,'09543658709','Mother',64),(53,'09554769810','Spouse',65),(54,'09565870921','Father',66),(55,'09576981032','Mother',67),(56,'09587092143','Brother',68),(57,'09598103254','Sister',69),(58,'09509214365','Father',70),(59,'09510325476','Mother',71),(60,'09521436587','Spouse',72),(61,'09532547698','Father',73),(62,'09543658709','Mother',74),(63,'09554769810','Brother',75),(64,'09565870921','Sister',76),(65,'09576981032','Father',77),(66,'09587092143','Mother',78),(67,'09598103254','Spouse',79),(68,'09509214365','Father',80),(69,'09510325476','Mother',81),(70,'09521436587','Brother',82),(71,'09532547698','Sister',83),(72,'09543658709','Father',84),(73,'09554769810','Mother',85),(74,'09565870921','Spouse',86),(75,'09576981032','Father',87),(76,'09587092143','Mother',88),(77,'09598103254','Brother',89),(78,'09509214365','Sister',90),(79,'09510325476','Father',91),(80,'09585214789','Father',92),(81,'09596325841','Mother',93),(82,'09574136952','Spouse',94),(83,'09585214790','Father',95),(84,'09596325842','Mother',96),(85,'09574136953','Brother',97),(86,'09585214791','Sister',98),(87,'09596325843','Father',99),(88,'09574136954','Mother',100),(89,'09585214792','Spouse',101),(90,'09596325844','Father',102),(91,'09574136955','Mother',103),(92,'09585214793','Brother',104),(93,'09596325845','Sister',105),(94,'09574136956','Father',106),(95,'09585214794','Mother',107),(96,'09596325846','Spouse',108),(97,'09574136957','Father',109),(98,'09585214795','Mother',110),(99,'09596325847','Brother',111),(100,'09574136958','Sister',112),(101,'09585214796','Father',113),(102,'09596325848','Mother',114),(103,'09574136959','Spouse',115),(104,'09585214797','Father',116),(105,'09596325849','Mother',117),(106,'09574136960','Brother',118),(107,'09585214798','Sister',119),(108,'09596325850','Father',120),(109,'09574136961','Mother',121),(110,'095151356','Father',NULL);
/*!40000 ALTER TABLE `emergency_contact` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `employee_id` bigint NOT NULL AUTO_INCREMENT,
  `created_date` datetime(6) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `staff_no` varchar(50) DEFAULT NULL,
  `full_name` varchar(50) NOT NULL,
  `gender` enum('Female','Male') DEFAULT NULL,
  `profile_picture_url` varchar(2048) DEFAULT NULL,
  `religion` enum('Buddhist','Christian','Muslim','Hindu') DEFAULT NULL,
  `staff_nrc_no` varchar(100) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `department_id` bigint DEFAULT NULL,
  `father_id` bigint DEFAULT NULL,
  `position_id` bigint DEFAULT NULL,
  `staff_type_id` bigint DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` longtext,
  `date_of_birth` date DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `emergency_contact_id` bigint DEFAULT NULL,
  `employment_status` enum('ACTIVE','RESIGNED','TERMINATED') DEFAULT NULL,
  `department_position_id` bigint DEFAULT NULL,
  `marital_status` enum('Single','Married') DEFAULT NULL,
  `race` varchar(100) DEFAULT NULL,
  `employee_spouse_id` bigint DEFAULT NULL,
  `status_effective_from` date DEFAULT NULL,
  `employment_status_reason` varchar(255) DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `UKedv9qdyvr6t5pe4ppmcyyloy` (`staff_no`),
  UNIQUE KEY `UK73l40lhrvbc5lltmb7etk2v3q` (`father_id`),
  UNIQUE KEY `UK87snrl0w8wig8ls2ipy2c5g6y` (`employee_spouse_id`),
  KEY `FKbejtwvg9bxus2mffsm3swj3u9` (`department_id`),
  KEY `FKbc8rdko9o9n1ri9bpdyxv3x7i` (`position_id`),
  KEY `FK2gtsdm47oitcqestiq95kan0f` (`staff_type_id`),
  KEY `fk_emergency_contact_idx` (`emergency_contact_id`),
  KEY `fk_employee_department_position` (`department_position_id`),
  KEY `idx_employee_manager_id` (`manager_id`),
  CONSTRAINT `FK2gtsdm47oitcqestiq95kan0f` FOREIGN KEY (`staff_type_id`) REFERENCES `staff_type` (`id`),
  CONSTRAINT `fk_emergency_contact` FOREIGN KEY (`emergency_contact_id`) REFERENCES `emergency_contact` (`id`),
  CONSTRAINT `fk_employee_department_position` FOREIGN KEY (`department_position_id`) REFERENCES `department_position` (`id`),
  CONSTRAINT `fk_employee_manager` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKbc8rdko9o9n1ri9bpdyxv3x7i` FOREIGN KEY (`position_id`) REFERENCES `position` (`position_id`),
  CONSTRAINT `FKbejtwvg9bxus2mffsm3swj3u9` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`),
  CONSTRAINT `FKg3u5qt3skmqmplbuqdoi3jx9k` FOREIGN KEY (`father_id`) REFERENCES `father` (`id`),
  CONSTRAINT `FKq52ycvklimc9v9oeq1p295hew` FOREIGN KEY (`employee_spouse_id`) REFERENCES `employee_spouse` (`spouse_id`)
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,'2026-04-18 17:04:59.000000','2024-01-01','admin@gmail.com','1','HR Admin','Female',NULL,'Buddhist','12/ABN(123)456','2026-04-25 17:11:25.000000',1,NULL,1,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',1,'Single',NULL,NULL,NULL,NULL,NULL),(2,'2026-04-18 17:04:59.000000','2024-01-01','hr@gmail.com','2','Myat noe aung','Male','/api/public/profile-pictures/cd8eb4ec-c022-4c9c-9132-de982e965980.jpg','Buddhist','13/CMN(456)789','2026-04-25 17:11:25.000000',1,NULL,1,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',1,'Single',NULL,NULL,NULL,NULL,NULL),(3,'2026-04-18 17:04:59.000000','2023-06-15','john.smith@epms.com','3','John Smith','Male',NULL,'Christian','14/DEF(789)012','2026-04-25 17:11:25.000000',2,NULL,3,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',3,'Single',NULL,NULL,NULL,NULL,29),(4,'2026-04-18 17:04:59.000000','2023-08-20','sarah.j@epms.com','4','Sarah Johnson','Female',NULL,'Christian','15/GHI(345)678','2026-04-25 17:11:25.000000',2,NULL,3,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',3,'Single',NULL,NULL,NULL,NULL,29),(5,'2026-04-18 17:04:59.000000','2024-01-10','mike.chen@epms.com','5','Mike Chen','Male',NULL,'Buddhist','16/JKL(901)234','2026-04-25 17:11:25.000000',2,NULL,4,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,29),(6,'2026-04-18 17:04:59.000000','2024-02-15','lisa.wong@epms.com','6','Lisa Wong','Female',NULL,'Buddhist','17/MNO(567)890','2026-04-25 17:11:25.000000',2,NULL,4,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,29),(7,'2026-04-18 17:04:59.000000','2024-03-01','david.kim@epms.com','7','David Kim','Male',NULL,'Christian','18/PQR(123)456','2026-04-25 17:11:25.000000',2,NULL,4,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,29),(8,'2026-04-18 17:04:59.000000','2023-05-10','alice.brown@epms.com','8','Alice Brown','Female',NULL,'Muslim','19/STU(789)012','2026-04-25 17:11:25.000000',3,NULL,6,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',6,'Single',NULL,NULL,NULL,NULL,NULL),(9,'2026-04-18 17:04:59.000000','2024-01-20','bob.wilson@epms.com','9','Bob Wilson','Male',NULL,'Buddhist','20/VWX(345)678','2026-04-25 17:11:25.000000',3,NULL,5,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',7,'Single',NULL,NULL,NULL,NULL,8),(10,'2026-04-18 17:04:59.000000','2023-07-01','carol.davis@epms.com','10','Carol Davis','Female',NULL,'Hindu','21/YZA(901)234','2026-04-25 17:11:25.000000',4,NULL,7,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',8,'Single',NULL,NULL,NULL,NULL,NULL),(11,'2026-04-18 17:04:59.000000','2022-01-01','ceo@epms.com','11','Robert CEO','Male',NULL,'Christian','22/BCD(567)890',NULL,NULL,NULL,8,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL,'Single',NULL,NULL,NULL,NULL,NULL),(12,'2026-04-18 17:06:09.000000',NULL,'admin@epms.com','12','System Admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL,'Single',NULL,NULL,NULL,NULL,NULL),(13,'2026-04-20 03:42:17.629122','2026-04-20','tylertyrell6@gmail.com','13','Tyler Tyrell','Male',NULL,'Buddhist','7/KaKaNa(N)165103','2026-04-28 14:50:29.000000',5,NULL,62,1,'095035786','Yangon, Myanmar','1999-03-20','Myanmar',2,2,NULL,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(14,'2026-04-20 04:39:47.712633','2026-04-20','tyrelltyler6@gmail.com','14','Ko Pyae','Male',NULL,'Buddhist','5/MaKaNa(E)457545','2026-04-28 14:50:29.000000',3,1,6,1,'+959516584705','Tamwe, Yangon, Myanmar','1994-04-09','Myanmar',2,2,1,'ACTIVE',6,'Single',NULL,NULL,NULL,NULL,NULL),(15,'2026-04-20 04:47:22.105860','2026-04-20','do7year2024@gmail.com','15','Ko Aung','Male',NULL,'Buddhist','12/DaPaNa(N)156896','2026-04-28 14:50:29.000000',4,2,7,1,'0950561876','Bagan, Myanmar','2002-11-20','Myanmar',2,2,2,'ACTIVE',7,'Single',NULL,NULL,NULL,NULL,NULL),(16,'2026-04-20 05:07:47.917040','2026-04-20','sharebotz@sharebot.net','16','Khant Ko Ko','Male',NULL,'Buddhist','10/YaMaNa(N)154812','2026-04-28 14:50:29.000000',6,3,59,1,'09625486535','Myingyan, Myanmar','2000-01-02','Myanmar',2,2,3,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(17,'2026-04-20 05:25:29.021176','2026-04-20','bamboohr@sharebot.net','17','Win Aung Aung','Male',NULL,'Buddhist','10/LaMaNa(N)541456','2026-04-28 14:50:29.000000',7,4,68,1,'095456855213','Myanmar','1990-04-10','Myanmar',2,2,4,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(18,'2026-04-20 05:34:52.780643','2026-04-20','rusni@rustyload.com','18','Rus Ni','Female','/api/public/profile-pictures/96a3d0f7-be85-44e8-9f47-e81f322e03ca.png','Buddhist','11/YaThaTa(N)158451','2026-04-28 14:50:29.000000',8,5,66,1,'09154741235','Myanmar','2004-04-23','Myanmar',2,2,5,'ACTIVE',7,'Single',NULL,NULL,NULL,NULL,NULL),(19,'2026-04-20 07:42:35.059743','2026-04-20','34implicit@rustyload.com','19','Nyein Maung','Male','/api/public/profile-pictures/dbc05276-960b-4747-abc6-69d806bf56bc.jpg','Buddhist','9/AhMaZa(N)845165','2026-04-28 14:50:29.000000',9,6,69,2,'0945163145','Myanmar, Yangon','1980-07-08','Myanmar',2,2,6,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(20,'2026-04-20 07:54:04.169926','2026-04-20','deltas@deltajohnsons.com','20','Kyaw Min','Male',NULL,'Christian','10/YaMaNa(N)453585','2026-04-28 14:50:29.000000',10,7,60,1,'09414651325','Yangon, Myanmar','1997-05-01','Myanmar',2,2,7,'ACTIVE',7,'Single',NULL,NULL,NULL,NULL,NULL),(21,'2026-04-21 14:47:18.136809','2026-04-21','deltasi@deltajohnsons.com','21','Aye Chan','Female','/api/public/profile-pictures/05499ae3-e041-449c-88aa-c6f62826dd9c.png','Christian','12/MaGaDa(N)156123','2026-04-29 10:16:52.424763',11,8,58,1,'099154154744','Yangon, Myanmar','1987-10-23','Myanmar',2,2,8,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(22,'2026-04-21 16:01:21.945933','2026-04-21','abcdef1@deltajohnsons.com','22','Phyo Aung','Male',NULL,'Buddhist','11/KaTaLa(N)515984','2026-04-28 14:50:29.000000',12,9,80,1,'09525841254','No 111, Tamwe Tsp, Yangon','1999-11-10','Myanmar',2,2,9,'ACTIVE',7,'Single',NULL,NULL,NULL,NULL,NULL),(23,'2026-04-21 16:50:50.022912','2026-04-21','phyomin@deltajohnsons.com','23','Phyo Min','Male',NULL,'Buddhist','11/ThaTaNa(N)126521','2026-04-28 14:50:29.000000',13,10,65,2,'094584156','No 123, Yangon','1990-01-05','Myanmar',2,2,10,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(27,'2026-04-21 19:35:40.614066','2026-04-22','livelytonia@fthcapital.com','24','Tun Tun','Male',NULL,'Buddhist','10/LaMaNa(N)489526','2026-04-28 14:50:29.000000',14,14,83,1,'09526845585','No 123 Myanmar','2001-07-08','Myanmar',2,2,14,'ACTIVE',7,'Single',NULL,NULL,NULL,NULL,NULL),(29,'2026-04-22 03:04:09.071084','2026-04-22','violetbobette@deltajohnsons.com','25','Min Min Tun','Male',NULL,'Buddhist','11/YaBaNa(N)815245','2026-04-28 09:08:45.476814',2,16,56,1,'095841265488','No 123, Bahan Tsp, Yangon','2001-08-01','Myanmar',2,2,16,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(32,'2026-04-23 06:10:19.116175','2026-04-23','delaz@deltajohnsons.com','26','Mo Mo','Female',NULL,'Buddhist','12/HtaTaPa(N)123685','2026-04-28 14:50:29.000000',2,19,3,1,'0945125412','Street 123','1999-01-01','Myanmar',2,2,19,'ACTIVE',3,'Single',NULL,NULL,NULL,NULL,29),(33,'2026-04-23 09:38:23.527976','2026-04-23','test1one@deltajohnsons.com','27','Aung Kaung Myat','Male',NULL,'Buddhist','7/NYALAPA(N)012390','2026-04-28 09:08:41.577781',5,20,62,1,'095057863','No 123 Boston','1990-09-15','Myanmar',2,2,20,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(34,'2026-04-23 09:38:29.491082','2026-04-23','testtwo@deltajohnsons.com','28','Ma Ma','Female',NULL,'Buddhist','7/NYALAPA(N)232390','2026-04-28 14:50:29.000000',3,21,6,1,'095057868','No 1222 Houston','2002-03-20','Myanmar',2,2,21,'ACTIVE',3,'Single',NULL,NULL,NULL,NULL,NULL),(36,'2026-04-23 14:32:08.437386','2026-04-23','kakakas@deltajohnsons.com','29','Hnin Hnin','Female','/api/public/profile-pictures/b1959b5e-7ce6-4941-98f0-b5c621c8b6fb.png','Buddhist','12/KaMaYa(N)025690','2026-04-28 09:08:38.413205',4,23,7,1,'095019327','Street 123 Database','2002-07-03','Myanmar',2,2,23,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(37,'2026-04-23 17:37:09.688763','2026-04-24','hninmin@deltajohnsons.com','30','Hnin Min','Female','/api/public/profile-pictures/5bee4b8e-8ae6-4d58-a403-6850174dcc09.png','Hindu','14/NgaThaKha(N)201548','2026-04-28 14:50:29.000000',6,24,59,1,'09112232424','Yangon','2000-02-02','Myanmar',2,2,24,'ACTIVE',3,'Single',NULL,NULL,NULL,NULL,NULL),(38,'2026-04-23 17:39:23.319254','2026-04-23','vdeltas@deltajohnsons.com','31','Aung Ko Ko','Male',NULL,'Buddhist','7/NYALAPA(N)112390','2026-04-28 09:09:06.361306',7,25,68,1,'095057863','No 123 Boston','1990-09-15','Myanmar',2,2,25,'ACTIVE',4,'Single',NULL,NULL,NULL,NULL,NULL),(39,'2026-04-29 07:33:25.542271','2026-04-29','detla@deltajohnsons.com','32','Det La','Female',NULL,'Buddhist','10/LaMaNa(N)252145','2026-04-29 07:33:25.542271',3,26,5,1,'09555555555555','No 123','1990-01-01',NULL,2,2,26,'ACTIVE',7,'Married','Burmese',1,NULL,NULL,8),(40,'2026-05-01 17:53:23.501397','2026-05-02','deltza@deltajohnsons.com','33','Zaw Zaw','Male',NULL,'Buddhist','11/YaThaTa(N)154845','2026-05-01 17:53:23.501397',2,27,72,1,'095254125532','No 123 Myanmar','1990-05-02',NULL,2,2,27,'ACTIVE',24,'Single','Burmese',NULL,NULL,NULL,29),(41,'2026-05-03 22:32:07.800139','2026-05-03','thant.zin@epms.com','34','Thant Zin Aung','Male',NULL,'Buddhist','15/YaThaTa(N)789654','2026-05-03 22:32:07.800139',2,28,72,1,'09789123456','No 456, Hlaing Tsp, Yangon','1995-08-15','Myanmar',2,2,28,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(42,'2026-05-06 12:56:59.000000','2026-05-06','aung.naing@epms.com','35','Aung Naing','Male',NULL,'Buddhist','12/LaMaNa(N)789456','2026-05-06 12:56:59.000000',2,30,4,1,'09512345678','No 123, Hlaing Tsp, Yangon','1995-03-15','Myanmar',2,NULL,30,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(43,'2026-05-06 12:56:59.000000','2026-05-06','su.mya@epms.com','36','Su Mya','Female',NULL,'Buddhist','12/DaGaTa(N)159357','2026-05-06 12:56:59.000000',2,31,4,2,'09523456789','No 456, Kamayut Tsp, Yangon','1998-07-22','Myanmar',2,NULL,31,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(44,'2026-05-06 12:56:59.000000','2026-05-06','kyaw.min@epms.com','37','Kyaw Min Oo','Male',NULL,'Buddhist','11/KaPaNa(N)456123','2026-05-06 12:56:59.000000',2,32,72,1,'09534567890','No 789, Bahan Tsp, Yangon','1993-11-08','Myanmar',2,NULL,32,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,29),(45,'2026-05-06 12:56:59.000000','2026-05-06','thin.zar@epms.com','38','Thin Zar Wai','Female',NULL,'Christian','10/YaThaNa(N)852963','2026-05-06 12:56:59.000000',2,33,72,2,'09545678901','No 321, Yankin Tsp, Yangon','1997-04-30','Myanmar',2,NULL,33,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(46,'2026-05-06 12:56:59.000000','2026-05-06','zaw.htet@epms.com','39','Zaw Htet Aung','Male',NULL,'Buddhist','9/PaTaKa(N)741852','2026-05-06 12:56:59.000000',2,34,3,1,'09556789012','No 654, Tamwe Tsp, Yangon','1990-09-12','Myanmar',2,NULL,34,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,29),(47,'2026-05-06 12:56:59.000000','2026-05-06','moe.san@epms.com','40','Moe San','Female',NULL,'Buddhist','8/MaMaNa(N)963852','2026-05-06 12:56:59.000000',2,35,4,1,'09567890123','No 987, Sanchaung Tsp, Yangon','1996-12-25','Myanmar',2,NULL,35,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(48,'2026-05-06 12:56:59.000000','2026-05-06','htet.khaing@epms.com','41','Htet Khaing','Male',NULL,'Muslim','12/DaGaTa(N)159358','2026-05-06 12:56:59.000000',2,36,72,2,'09578901234','No 147, Dagon Tsp, Yangon','2000-01-18','Myanmar',2,NULL,36,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(49,'2026-05-06 12:56:59.000000','2026-05-06','eithin.zar@epms.com','42','Ei Thin Zar','Female',NULL,'Buddhist','11/ThaHtaNa(N)753951','2026-05-06 12:56:59.000000',2,37,4,1,'09589012345','No 258, Ahlone Tsp, Yangon','1994-06-05','Myanmar',2,NULL,37,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,29),(50,'2026-05-06 12:56:59.000000','2026-05-06','myat.thu@epms.com','43','Myat Thu','Male',NULL,'Buddhist','10/LaKaNa(N)456790','2026-05-06 12:56:59.000000',2,38,3,1,'09590123456','No 369, Lanmadaw Tsp, Yangon','1991-08-20','Myanmar',2,NULL,38,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(51,'2026-05-06 12:56:59.000000','2026-05-06','wai.yee@epms.com','44','Wai Yee Mon','Female',NULL,'Hindu','9/GaMaNa(N)852147','2026-05-06 12:56:59.000000',2,39,72,2,'09501234567','No 741, Kyauktada Tsp, Yangon','1999-02-14','Myanmar',2,NULL,39,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(52,'2026-05-06 12:56:59.000000','2026-05-06','soe.moe@epms.com','45','Soe Moe Kyaw','Male',NULL,'Buddhist','12/KaKhaMa(N)369852','2026-05-06 12:56:59.000000',3,NULL,5,1,'09511223344','No 123, Mayangone Tsp, Yangon','1992-05-10','Myanmar',2,NULL,40,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,8),(53,'2026-05-06 12:56:59.000000','2026-05-06','nandar.oo@epms.com','46','Nandar Oo','Female',NULL,'Buddhist','12/LaMaNa(N)789457','2026-05-06 12:56:59.000000',3,NULL,6,1,'09522334455','No 456, Mingaladon Tsp, Yangon','1988-09-25','Myanmar',2,NULL,41,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(54,'2026-05-06 12:56:59.000000','2026-05-06','pyae.phyoe@epms.com','47','Pyae Phyoe Aung','Male',NULL,'Christian','12/DaGaTa(N)159358','2026-05-06 12:56:59.000000',3,NULL,5,2,'09533445566','No 789, Insein Tsp, Yangon','2001-03-30','Myanmar',2,NULL,42,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(55,'2026-05-06 12:56:59.000000','2026-05-06','khaing.mar@epms.com','48','Khaing Mar Kyaw','Female',NULL,'Buddhist','11/KaPaNa(N)456124','2026-05-06 12:56:59.000000',3,NULL,63,1,'09544556677','No 321, North Okkalapa Tsp, Yangon','1993-07-15','Myanmar',2,NULL,43,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(56,'2026-05-06 12:56:59.000000','2026-05-06','thura.htet@epms.com','49','Thura Htet','Male',NULL,'Buddhist','10/YaThaNa(N)852964','2026-05-06 12:56:59.000000',3,NULL,76,2,'09555667788','No 654, South Okkalapa Tsp, Yangon','2000-11-20','Myanmar',2,NULL,44,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(57,'2026-05-06 12:56:59.000000','2026-05-06','moe.mya@epms.com','50','Moe Mya Thwin','Female',NULL,'Muslim','9/PaTaKa(N)741853','2026-05-06 12:56:59.000000',3,NULL,76,1,'09566778899','No 987, Thingangyun Tsp, Yangon','1996-04-05','Myanmar',2,NULL,45,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(58,'2026-05-06 12:56:59.000000','2026-05-06','aung.ko@epms.com','51','Aung Ko Latt','Male',NULL,'Buddhist','8/MaMaNa(N)963853','2026-05-06 12:56:59.000000',3,NULL,63,1,'09577889900','No 147, Thaketa Tsp, Yangon','1990-12-30','Myanmar',2,NULL,46,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,8),(59,'2026-05-06 12:56:59.000000','2026-05-06','yamin.thu@epms.com','52','Yamin Thu','Female',NULL,'Hindu','12/DaGaTa(N)159359','2026-05-06 12:56:59.000000',3,NULL,5,2,'09588990011','No 258, Dawbon Tsp, Yangon','2002-06-18','Myanmar',2,NULL,47,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(60,'2026-05-06 12:56:59.000000','2026-05-06','thein.htay@epms.com','53','Thein Htay','Male',NULL,'Buddhist','11/ThaHtaNa(N)753952','2026-05-06 12:56:59.000000',4,NULL,7,1,'09599001122','No 369, Pazundaung Tsp, Yangon','1987-03-22','Myanmar',2,NULL,48,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(61,'2026-05-06 12:56:59.000000','2026-05-06','sanda.khine@epms.com','54','Sanda Khine','Female',NULL,'Buddhist','10/LaKaNa(N)456791','2026-05-06 12:56:59.000000',4,NULL,61,1,'09500112233','No 741, Botataung Tsp, Yangon','1991-08-14','Myanmar',2,NULL,49,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(62,'2026-05-06 12:56:59.000000','2026-05-06','nyunt.win@epms.com','55','Nyunt Win','Male',NULL,'Christian','9/GaMaNa(N)852148','2026-05-06 12:56:59.000000',4,NULL,7,2,'09521436587','No 852, Dala Tsp, Yangon','2000-05-09','Myanmar',2,NULL,50,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(63,'2026-05-06 12:56:59.000000','2026-05-06','khin.thida@epms.com','56','Khin Thida','Female',NULL,'Buddhist','12/KaKhaMa(N)369853','2026-05-06 12:56:59.000000',4,NULL,61,1,'09532547698','No 963, Seikkan Tsp, Yangon','1994-10-28','Myanmar',2,NULL,51,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(64,'2026-05-06 12:56:59.000000','2026-05-06','min.thant@epms.com','57','Min Thant Kyaw','Male',NULL,'Muslim','12/LaMaNa(N)789458','2026-05-06 12:56:59.000000',4,NULL,7,2,'09543658709','No 159, Hlaingthaya Tsp, Yangon','2001-12-03','Myanmar',2,NULL,52,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(65,'2026-05-06 12:56:59.000000','2026-05-06','zu.zu@epms.com','58','Zu Zu Aye','Female',NULL,'Buddhist','12/DaGaTa(N)159360','2026-05-06 12:56:59.000000',4,NULL,7,1,'09554769810','No 357, Shwepyitha Tsp, Yangon','1997-07-19','Myanmar',2,NULL,53,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(66,'2026-05-06 12:56:59.000000','2026-05-06','ye.lin@epms.com','59','Ye Lin Aung','Male',NULL,'Buddhist','11/KaPaNa(N)456125','2026-05-06 12:56:59.000000',5,NULL,62,1,'09565870921','No 456, Insein Tsp, Yangon','1992-02-28','Myanmar',2,NULL,54,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(67,'2026-05-06 12:56:59.000000','2026-05-06','chaw.su@epms.com','60','Chaw Su Hlaing','Female',NULL,'Buddhist','10/YaThaNa(N)852965','2026-05-06 12:56:59.000000',5,NULL,62,2,'09576981032','No 789, Kamayut Tsp, Yangon','2000-09-15','Myanmar',2,NULL,55,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(68,'2026-05-06 12:56:59.000000','2026-05-06','htun.lin@epms.com','61','Htun Lin','Male',NULL,'Hindu','9/PaTaKa(N)741854','2026-05-06 12:56:59.000000',5,NULL,62,1,'09587092143','No 321, Hlaing Tsp, Yangon','1995-04-22','Myanmar',2,NULL,56,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(69,'2026-05-06 12:56:59.000000','2026-05-06','may.thu@epms.com','62','May Thu Kyaw','Female',NULL,'Buddhist','8/MaMaNa(N)963854','2026-05-06 12:56:59.000000',5,NULL,62,2,'09598103254','No 654, Bahan Tsp, Yangon','2001-11-08','Myanmar',2,NULL,57,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(70,'2026-05-06 12:56:59.000000','2026-05-06','kaung.myat@epms.com','63','Kaung Myat Thu','Male',NULL,'Christian','12/DaGaTa(N)159361','2026-05-06 12:56:59.000000',5,NULL,62,1,'09509214365','No 987, Yankin Tsp, Yangon','1993-06-30','Myanmar',2,NULL,58,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(71,'2026-05-06 12:56:59.000000','2026-05-06','sai.kham@epms.com','64','Sai Kham Leik','Male',NULL,'Buddhist','11/ThaHtaNa(N)753953','2026-05-06 12:56:59.000000',6,NULL,59,1,'09510325476','No 123, Sanchaung Tsp, Yangon','1990-01-15','Myanmar',2,NULL,59,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(72,'2026-05-06 12:56:59.000000','2026-05-06','nang.kham@epms.com','65','Nang Kham','Female',NULL,'Christian','10/LaKaNa(N)456792','2026-05-06 12:56:59.000000',6,NULL,73,1,'09521436587','No 456, Tamwe Tsp, Yangon','1995-08-20','Myanmar',2,NULL,60,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,16),(73,'2026-05-06 12:56:59.000000','2026-05-06','than.tun@epms.com','66','Than Tun','Male',NULL,'Buddhist','9/GaMaNa(N)852149','2026-05-06 12:56:59.000000',6,NULL,74,2,'09532547698','No 789, Dagon Tsp, Yangon','2002-03-10','Myanmar',2,NULL,61,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,16),(74,'2026-05-06 12:56:59.000000','2026-05-06','hnin.wai@epms.com','67','Hnin Wai','Female',NULL,'Muslim','12/KaKhaMa(N)369854','2026-05-06 12:56:59.000000',6,NULL,73,1,'09543658709','No 321, Ahlone Tsp, Yangon','1997-12-05','Myanmar',2,NULL,62,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,16),(75,'2026-05-06 12:56:59.000000','2026-05-06','zaw.myint@epms.com','68','Zaw Myint','Male',NULL,'Buddhist','12/LaMaNa(N)789459','2026-05-06 12:56:59.000000',6,NULL,74,2,'09554769810','No 654, Lanmadaw Tsp, Yangon','2000-05-25','Myanmar',2,NULL,63,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,16),(76,'2026-05-06 12:56:59.000000','2026-05-06','kyaw.soe@epms.com','69','Kyaw Soe Win','Male',NULL,'Buddhist','12/DaGaTa(N)159362','2026-05-06 12:56:59.000000',7,NULL,68,1,'09565870921','No 987, Kyauktada Tsp, Yangon','1992-09-18','Myanmar',2,NULL,64,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(77,'2026-05-06 12:56:59.000000','2026-05-06','aye.chan@epms.com','70','Aye Chan Thar','Female',NULL,'Buddhist','11/KaPaNa(N)456126','2026-05-06 12:56:59.000000',7,NULL,68,2,'09576981032','No 147, Mayangone Tsp, Yangon','2001-04-12','Myanmar',2,NULL,65,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(78,'2026-05-06 12:56:59.000000','2026-05-06','thant.zin@epms.com','71','Thant Zin Oo','Male',NULL,'Hindu','10/YaThaNa(N)852966','2026-05-06 12:56:59.000000',7,NULL,68,1,'09587092143','No 258, Mingaladon Tsp, Yangon','1994-07-28','Myanmar',2,NULL,66,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(79,'2026-05-06 12:56:59.000000','2026-05-06','mo.mo@epms.com','72','Mo Mo Thant','Female',NULL,'Buddhist','9/PaTaKa(N)741855','2026-05-06 12:56:59.000000',7,NULL,68,2,'09598103254','No 369, Insein Tsp, Yangon','2000-02-14','Myanmar',2,NULL,67,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(80,'2026-05-06 12:56:59.000000','2026-05-06','myo.min@epms.com','73','Myo Min Khant','Male',NULL,'Christian','8/MaMaNa(N)963855','2026-05-06 12:56:59.000000',7,NULL,68,1,'09509214365','No 741, North Okkalapa Tsp, Yangon','1996-11-30','Myanmar',2,NULL,68,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(81,'2026-05-06 12:56:59.000000','2026-05-06','thet.htwe@epms.com','74','Thet Htwe','Female',NULL,'Buddhist','12/DaGaTa(N)159363','2026-05-06 12:56:59.000000',8,NULL,66,1,'09510325476','No 852, South Okkalapa Tsp, Yangon','1990-05-20','Myanmar',2,NULL,69,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(82,'2026-05-06 12:56:59.000000','2026-05-06','nay.lin@epms.com','75','Nay Lin Aung','Male',NULL,'Muslim','11/ThaHtaNa(N)753954','2026-05-06 12:56:59.000000',8,NULL,66,2,'09521436587','No 963, Thingangyun Tsp, Yangon','2001-08-15','Myanmar',2,NULL,70,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(83,'2026-05-06 12:56:59.000000','2026-05-06','phyo.thu@epms.com','76','Phyo Thu Zaw','Male',NULL,'Buddhist','10/LaKaNa(N)456793','2026-05-06 12:56:59.000000',8,NULL,66,1,'09532547698','No 159, Thaketa Tsp, Yangon','1993-12-08','Myanmar',2,NULL,71,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(84,'2026-05-06 12:56:59.000000','2026-05-06','chit.oo@epms.com','77','Chit Oo','Female',NULL,'Buddhist','9/GaMaNa(N)852150','2026-05-06 12:56:59.000000',9,NULL,69,1,'09543658709','No 357, Dawbon Tsp, Yangon','1997-03-25','Myanmar',2,NULL,72,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(85,'2026-05-06 12:56:59.000000','2026-05-06','ko.ko@epms.com','78','Ko Ko Gyi','Male',NULL,'Hindu','12/KaKhaMa(N)369855','2026-05-06 12:56:59.000000',9,NULL,79,2,'09554769810','No 456, Pazundaung Tsp, Yangon','2002-07-19','Myanmar',2,NULL,73,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(86,'2026-05-06 12:56:59.000000','2026-05-06','swe.zin@epms.com','79','Swe Zin Htet','Female',NULL,'Christian','12/LaMaNa(N)789460','2026-05-06 12:56:59.000000',9,NULL,79,1,'09565870921','No 789, Botataung Tsp, Yangon','1998-10-15','Myanmar',2,NULL,74,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(87,'2026-05-06 12:56:59.000000','2026-05-06','myo.htet@epms.com','80','Myo Htet','Male',NULL,'Buddhist','12/DaGaTa(N)159364','2026-05-06 12:56:59.000000',10,NULL,60,1,'09576981032','No 321, Dala Tsp, Yangon','1991-06-22','Myanmar',2,NULL,75,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(88,'2026-05-06 12:56:59.000000','2026-05-06','eichan.thu@epms.com','81','Ei Chan Thu','Female',NULL,'Buddhist','11/KaPaNa(N)456127','2026-05-06 12:56:59.000000',10,NULL,60,2,'09587092143','No 654, Seikkan Tsp, Yangon','1999-01-30','Myanmar',2,NULL,76,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(89,'2026-05-06 12:56:59.000000','2026-05-06','aung.thu@epms.com','82','Aung Thu Rha','Male',NULL,'Muslim','10/YaThaNa(N)852967','2026-05-06 12:56:59.000000',11,NULL,58,1,'09598103254','No 987, Hlaingthaya Tsp, Yangon','1992-04-18','Myanmar',2,NULL,77,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(90,'2026-05-06 12:56:59.000000','2026-05-06','thida.oo@epms.com','83','Thida Oo','Female',NULL,'Buddhist','9/PaTaKa(N)741856','2026-05-06 12:56:59.000000',11,NULL,58,2,'09509214365','No 147, Shwepyitha Tsp, Yangon','2000-09-22','Myanmar',2,NULL,78,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(91,'2026-05-06 12:56:59.000000','2026-05-06','tun.lin@epms.com','84','Tun Lin','Male',NULL,'Buddhist','8/MaMaNa(N)963856','2026-05-06 12:56:59.000000',14,NULL,83,1,'09510325476','No 258, Insein Tsp, Yangon','1988-12-10','Myanmar',2,NULL,79,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(92,'2026-05-06 13:46:55.000000','2026-05-06','aung.thura@epms.com','85','Aung Thura','Male',NULL,'Buddhist','12/LaMaNa(N)852741','2026-05-06 13:46:55.000000',2,40,3,1,'09585214789','No 111, Hlaing Tsp, Yangon','1990-06-15','Myanmar',2,NULL,80,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,29),(93,'2026-05-06 13:46:55.000000','2026-05-06','thazin.htwe@epms.com','86','Thazin Htwe','Female',NULL,'Christian','11/KaPaNa(N)963852','2026-05-06 13:46:55.000000',2,41,3,1,'09596325841','No 222, Kamayut Tsp, Yangon','1991-09-20','Myanmar',2,NULL,81,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(94,'2026-05-06 13:46:55.000000','2026-05-06','kaung.sithu@epms.com','87','Kaung Sithu','Male',NULL,'Buddhist','10/YaThaNa(N)741963','2026-05-06 13:46:55.000000',2,42,4,1,'09574136952','No 333, Bahan Tsp, Yangon','1995-11-08','Myanmar',2,NULL,82,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(95,'2026-05-06 13:46:55.000000','2026-05-06','nwe.oo@epms.com','88','Nwe Oo','Female',NULL,'Muslim','9/PaTaKa(N)852741','2026-05-06 13:46:55.000000',2,43,4,2,'09585214790','No 444, Yankin Tsp, Yangon','2000-03-25','Myanmar',2,NULL,83,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(96,'2026-05-06 13:46:55.000000','2026-05-06','myat.noe@epms.com','89','Myat Noe','Female',NULL,'Buddhist','8/MaMaNa(N)963741','2026-05-06 13:46:55.000000',3,44,5,1,'09596325842','No 555, Sanchaung Tsp, Yangon','1993-12-10','Myanmar',2,NULL,84,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,8),(97,'2026-05-06 13:46:55.000000','2026-05-06','min.thu@epms.com','90','Min Thu','Male',NULL,'Hindu','12/DaGaTa(N)852963','2026-05-06 13:46:55.000000',3,45,5,2,'09574136953','No 666, Dagon Tsp, Yangon','2001-07-18','Myanmar',2,NULL,85,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(98,'2026-05-06 13:46:55.000000','2026-05-06','thet.mon@epms.com','91','Thet Mon','Female',NULL,'Buddhist','11/ThaHtaNa(N)741852','2026-05-06 13:46:55.000000',1,46,8,1,'09585214791','No 777, Ahlone Tsp, Yangon','1978-04-30','Myanmar',2,NULL,86,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,1),(99,'2026-05-06 13:46:55.000000','2026-05-06','consultant.one@epms.com','92','John William','Male',NULL,'Christian','10/LaKaNa(N)963741','2026-05-06 13:46:55.000000',1,47,57,1,'09596325843','No 888, Lanmadaw Tsp, Yangon','1985-01-15','Myanmar',2,NULL,87,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,1),(100,'2026-05-06 13:46:55.000000','2026-05-06','soe.sandar@epms.com','93','Soe Sandar','Female',NULL,'Buddhist','9/GaMaNa(N)852963','2026-05-06 13:46:55.000000',3,48,63,1,'09574136954','No 999, Kyauktada Tsp, Yangon','1988-08-22','Myanmar',2,NULL,88,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,8),(101,'2026-05-06 13:46:55.000000','2026-05-06','kyaw.thu@epms.com','94','Kyaw Thu','Male',NULL,'Buddhist','12/KaKhaMa(N)741852','2026-05-06 13:46:55.000000',3,49,63,2,'09585214792','No 111, Mayangone Tsp, Yangon','2000-02-14','Myanmar',2,NULL,89,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(102,'2026-05-06 13:46:55.000000','2026-05-06','hnin.si@epms.com','95','Hnin Si','Female',NULL,'Buddhist','12/LaMaNa(N)159753','2026-05-06 13:46:55.000000',8,50,66,1,'09596325844','No 222, Mingaladon Tsp, Yangon','1992-06-10','Myanmar',2,NULL,90,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(103,'2026-05-06 13:46:55.000000','2026-05-06','aung.myat@epms.com','96','Aung Myat Kyaw','Male',NULL,'Muslim','11/KaPaNa(N)951753','2026-05-06 13:46:55.000000',8,51,66,2,'09574136955','No 333, Insein Tsp, Yangon','1999-11-28','Myanmar',2,NULL,91,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(104,'2026-05-06 13:46:55.000000','2026-05-06','zaw.lin@epms.com','97','Zaw Lin Htet','Male',NULL,'Buddhist','10/YaThaNa(N)753159','2026-05-06 13:46:55.000000',7,52,68,1,'09585214793','No 444, North Okkalapa Tsp, Yangon','1990-09-05','Myanmar',2,NULL,92,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(105,'2026-05-06 13:46:55.000000','2026-05-06','mya.thida@epms.com','98','Mya Thida','Female',NULL,'Christian','9/PaTaKa(N)951357','2026-05-06 13:46:55.000000',7,53,68,1,'09596325845','No 555, South Okkalapa Tsp, Yangon','1993-04-18','Myanmar',2,NULL,93,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(106,'2026-05-06 13:46:55.000000','2026-05-06','phyo.wai@epms.com','99','Phyo Wai Yan','Male',NULL,'Hindu','8/MaMaNa(N)753951','2026-05-06 13:46:55.000000',9,54,69,1,'09574136956','No 666, Thingangyun Tsp, Yangon','1995-12-15','Myanmar',2,NULL,94,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(107,'2026-05-06 13:46:55.000000','2026-05-06','kyi.san@epms.com','100','Kyi San','Female',NULL,'Buddhist','12/DaGaTa(N)159753','2026-05-06 13:46:55.000000',2,55,70,1,'09585214794','No 777, Thaketa Tsp, Yangon','1990-07-22','Myanmar',2,NULL,95,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,29),(108,'2026-05-06 13:46:55.000000','2026-05-06','lwin.oo@epms.com','101','Lwin Oo','Male',NULL,'Buddhist','11/ThaHtaNa(N)951753','2026-05-06 13:46:55.000000',2,56,71,1,'09596325846','No 888, Dawbon Tsp, Yangon','1989-03-30','Myanmar',2,NULL,96,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,29),(109,'2026-05-06 13:46:55.000000','2026-05-06','moe.thuzar@epms.com','102','Moe Thuzar','Female',NULL,'Buddhist','10/LaKaNa(N)753159','2026-05-06 13:46:55.000000',2,57,71,1,'09574136957','No 999, Pazundaung Tsp, Yangon','1992-10-12','Myanmar',2,NULL,97,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(110,'2026-05-06 13:46:55.000000','2026-05-06','tun.lwin@epms.com','103','Tun Lwin','Male',NULL,'Buddhist','9/GaMaNa(N)951357','2026-05-06 13:46:55.000000',2,58,72,1,'09585214795','No 111, Botataung Tsp, Yangon','1998-05-08','Myanmar',2,NULL,98,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(111,'2026-05-06 13:46:55.000000','2026-05-06','yadanar.oo@epms.com','104','Yadanar Oo','Female',NULL,'Muslim','12/KaKhaMa(N)753951','2026-05-06 13:46:55.000000',2,59,72,2,'09596325847','No 222, Dala Tsp, Yangon','2001-01-20','Myanmar',2,NULL,99,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(112,'2026-05-06 13:46:55.000000','2026-05-06','aung.kyaw@epms.com','105','Aung Kyaw Moe','Male',NULL,'Buddhist','12/LaMaNa(N)852742','2026-05-06 13:46:55.000000',6,NULL,73,1,'09574136958','No 333, Seikkan Tsp, Yangon','1996-08-14','Myanmar',2,NULL,100,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,16),(113,'2026-05-06 13:46:55.000000','2026-05-06','thu.rain@epms.com','106','Thu Rain','Male',NULL,'Christian','11/KaPaNa(N)963853','2026-05-06 13:46:55.000000',6,NULL,73,2,'09585214796','No 444, Hlaingthaya Tsp, Yangon','2002-02-28','Myanmar',2,NULL,101,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,16),(114,'2026-05-06 13:46:55.000000','2026-05-06','nandar.aung@epms.com','107','Nandar Aung','Female',NULL,'Buddhist','10/YaThaNa(N)741964','2026-05-06 13:46:55.000000',2,NULL,75,1,'09596325848','No 555, Shwepyitha Tsp, Yangon','1994-11-05','Myanmar',2,NULL,102,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,29),(115,'2026-05-06 13:46:55.000000','2026-05-06','yamin.ko@epms.com','108','Yamin Ko','Female',NULL,'Hindu','9/PaTaKa(N)852742','2026-05-06 13:46:55.000000',3,NULL,76,2,'09574136959','No 666, Insein Tsp, Yangon','2003-04-15','Myanmar',2,NULL,103,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(116,'2026-05-06 13:46:55.000000','2026-05-06','aung.min@epms.com','109','Aung Min Khant','Male',NULL,'Buddhist','8/MaMaNa(N)963742','2026-05-06 13:46:55.000000',3,NULL,76,1,'09585214797','No 777, Hlaing Tsp, Yangon','1999-09-22','Myanmar',2,NULL,104,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,8),(117,'2026-05-06 13:46:55.000000','2026-05-06','thin.nwe@epms.com','110','Thin Nwe Soe','Female',NULL,'Buddhist','12/DaGaTa(N)852964','2026-05-06 13:46:55.000000',9,NULL,79,2,'09596325849','No 888, Kamayut Tsp, Yangon','2002-07-10','Myanmar',2,NULL,105,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(118,'2026-05-06 13:46:55.000000','2026-05-06','kyaw.swar@epms.com','111','Kyaw Swar Lin','Male',NULL,'Buddhist','11/ThaHtaNa(N)741853','2026-05-06 13:46:55.000000',9,NULL,79,2,'09574136960','No 999, Bahan Tsp, Yangon','2001-12-25','Myanmar',2,NULL,106,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(119,'2026-05-06 13:46:55.000000','2026-05-06','aung.naing@epms.com','112','Aung Naing Tun','Male',NULL,'Buddhist','10/LaKaNa(N)963742','2026-05-06 13:46:55.000000',12,NULL,80,2,'09585214798','No 111, Yankin Tsp, Yangon','2004-03-18','Myanmar',2,NULL,107,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(120,'2026-05-06 13:46:55.000000','2026-05-06','su.hlaing@epms.com','113','Su Hlaing','Female',NULL,'Muslim','9/GaMaNa(N)852964','2026-05-06 13:46:55.000000',12,NULL,80,2,'09596325850','No 222, Sanchaung Tsp, Yangon','2003-10-05','Myanmar',2,NULL,108,'ACTIVE',NULL,'Single','Burmese',NULL,NULL,NULL,NULL),(121,'2026-05-06 13:46:55.000000','2026-05-06','ko.ko@epms.com','114','Ko Ko','Male',NULL,'Buddhist','12/KaKhaMa(N)741853','2026-05-06 13:46:55.000000',14,NULL,81,1,'09574136961','No 333, Dagon Tsp, Yangon','1985-06-20','Myanmar',2,NULL,109,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(122,'2026-05-06 13:46:55.000000','2026-05-06','aye.aye@epms.com','115','Aye Aye','Female',NULL,'Buddhist','12/LaMaNa(N)159754','2026-05-06 13:46:55.000000',13,NULL,82,1,'09585214799','No 444, Ahlone Tsp, Yangon','1988-12-10','Myanmar',2,NULL,NULL,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(123,'2026-05-06 13:46:55.000000','2026-05-06','tun.tun@epms.com','116','Tun Tun','Male',NULL,'Buddhist','11/KaPaNa(N)951754','2026-05-06 13:46:55.000000',14,NULL,83,1,'09596325851','No 555, Lanmadaw Tsp, Yangon','1986-05-15','Myanmar',2,NULL,NULL,'ACTIVE',NULL,'Married','Burmese',NULL,NULL,NULL,NULL),(124,'2026-05-11 06:56:38.739767','2026-05-11','johnsonde@deltajohnsons.com','117','Kyaw Oo','Male',NULL,'Christian','14/MaMaNa(N)251451','2026-05-11 06:56:38.739767',2,60,4,1,'09526984565','Street 123','1993-09-22',NULL,2,2,110,'ACTIVE',4,'Single','Burmese',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_context_snapshot`
--

DROP TABLE IF EXISTS `employee_context_snapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_context_snapshot` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `appraiser_employee_id` bigint DEFAULT NULL,
  `appraiser_name` varchar(255) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) NOT NULL,
  `department_id` bigint NOT NULL,
  `department_name` varchar(255) NOT NULL,
  `employee_department_history_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `employee_reporting_history_id` bigint DEFAULT NULL,
  `manager_employee_id` bigint DEFAULT NULL,
  `manager_name` varchar(255) DEFAULT NULL,
  `module_type` enum('APPRAISAL','FEEDBACK_360','KPI','ONE_ON_ONE','PIP','SELF_ASSESSMENT') NOT NULL,
  `position_id` bigint NOT NULL,
  `position_name` varchar(255) NOT NULL,
  `reference_id` bigint NOT NULL,
  `snapshot_effective_date` date NOT NULL,
  `staff_no` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_snapshot_module_ref` (`module_type`,`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_context_snapshot`
--

LOCK TABLES `employee_context_snapshot` WRITE;
/*!40000 ALTER TABLE `employee_context_snapshot` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_context_snapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_department_history`
--

DROP TABLE IF EXISTS `employee_department_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_department_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) NOT NULL,
  `is_current` bit(1) NOT NULL,
  `effective_end_date` date DEFAULT NULL,
  `effective_start_date` date NOT NULL,
  `transfer_type` enum('INITIAL','PERMANENT_TRANSFER','RETURN','TEMPORARY') NOT NULL,
  `reason` text,
  `remarks` text,
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `from_department_id` bigint DEFAULT NULL,
  `from_position_id` bigint DEFAULT NULL,
  `to_department_id` bigint NOT NULL,
  `to_position_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKa15fgkgkk57vwb7qw5djc6n4s` (`from_department_id`),
  KEY `FKqxpeqxq865w4ncup17xjdjv7s` (`from_position_id`),
  KEY `FKmasax30kcyrsylulr3nw62i73` (`to_department_id`),
  KEY `FKgyb4tyofucvj5t5ni0i8t7e6k` (`to_position_id`),
  KEY `idx_edh_employee_current` (`employee_id`,`is_current`),
  KEY `idx_edh_employee_start` (`employee_id`,`effective_start_date`),
  KEY `idx_edh_transfer_type` (`transfer_type`),
  CONSTRAINT `FKa15fgkgkk57vwb7qw5djc6n4s` FOREIGN KEY (`from_department_id`) REFERENCES `department` (`department_id`),
  CONSTRAINT `FKg2sa00m7d4brjgava99ifosq3` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKgyb4tyofucvj5t5ni0i8t7e6k` FOREIGN KEY (`to_position_id`) REFERENCES `position` (`position_id`),
  CONSTRAINT `FKmasax30kcyrsylulr3nw62i73` FOREIGN KEY (`to_department_id`) REFERENCES `department` (`department_id`),
  CONSTRAINT `FKqxpeqxq865w4ncup17xjdjv7s` FOREIGN KEY (`from_position_id`) REFERENCES `position` (`position_id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_department_history`
--

LOCK TABLES `employee_department_history` WRITE;
/*!40000 ALTER TABLE `employee_department_history` DISABLE KEYS */;
INSERT INTO `employee_department_history` VALUES (2,2,'2026-04-23 06:10:19.232771',_binary '',NULL,'2026-04-23','INITIAL',NULL,NULL,NULL,NULL,32,NULL,NULL,2,3),(3,2,'2026-04-23 14:32:08.486797',_binary '',NULL,'2026-04-23','INITIAL',NULL,NULL,NULL,NULL,36,NULL,NULL,2,4),(4,2,'2026-04-23 17:37:09.744371',_binary '',NULL,'2026-04-24','INITIAL',NULL,NULL,NULL,NULL,37,NULL,NULL,2,3),(5,2,'2026-04-29 07:33:25.635525',_binary '',NULL,'2026-04-29','INITIAL',NULL,NULL,NULL,NULL,39,NULL,NULL,3,5),(6,2,'2026-05-01 17:53:23.513402',_binary '',NULL,'2026-05-02','INITIAL',NULL,NULL,NULL,NULL,40,NULL,NULL,2,72),(7,2,'2026-05-03 22:37:29.269294',_binary '',NULL,'2026-05-03','INITIAL',NULL,NULL,NULL,NULL,41,NULL,NULL,2,72),(8,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,42,NULL,NULL,2,4),(9,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,43,NULL,NULL,2,4),(10,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,44,NULL,NULL,2,72),(11,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,45,NULL,NULL,2,72),(12,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,46,NULL,NULL,2,3),(13,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,47,NULL,NULL,2,4),(14,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,48,NULL,NULL,2,72),(15,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,49,NULL,NULL,2,4),(16,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,50,NULL,NULL,2,3),(17,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,51,NULL,NULL,2,72),(18,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,52,NULL,NULL,3,5),(19,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,53,NULL,NULL,3,6),(20,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,54,NULL,NULL,3,5),(21,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,55,NULL,NULL,3,63),(22,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,56,NULL,NULL,3,76),(23,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,57,NULL,NULL,3,76),(24,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,58,NULL,NULL,3,63),(25,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,59,NULL,NULL,3,5),(26,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,60,NULL,NULL,4,7),(27,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,61,NULL,NULL,4,61),(28,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,62,NULL,NULL,4,7),(29,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,63,NULL,NULL,4,61),(30,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,64,NULL,NULL,4,7),(31,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,65,NULL,NULL,4,7),(32,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,66,NULL,NULL,5,62),(33,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,67,NULL,NULL,5,62),(34,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,68,NULL,NULL,5,62),(35,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,69,NULL,NULL,5,62),(36,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,70,NULL,NULL,5,62),(37,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,71,NULL,NULL,6,59),(38,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,72,NULL,NULL,6,73),(39,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,73,NULL,NULL,6,74),(40,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,74,NULL,NULL,6,73),(41,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,75,NULL,NULL,6,74),(42,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,76,NULL,NULL,7,68),(43,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,77,NULL,NULL,7,68),(44,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,78,NULL,NULL,7,68),(45,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,79,NULL,NULL,7,68),(46,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,80,NULL,NULL,7,68),(47,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,81,NULL,NULL,8,66),(48,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,82,NULL,NULL,8,66),(49,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,83,NULL,NULL,8,66),(50,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,84,NULL,NULL,9,69),(51,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,85,NULL,NULL,9,79),(52,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,86,NULL,NULL,9,79),(53,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,87,NULL,NULL,10,60),(54,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,88,NULL,NULL,10,60),(55,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,89,NULL,NULL,11,58),(56,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,90,NULL,NULL,11,58),(57,2,'2026-05-06 12:57:36.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,91,NULL,NULL,14,83),(58,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,92,NULL,NULL,2,3),(59,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,93,NULL,NULL,2,3),(60,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,94,NULL,NULL,2,4),(61,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,95,NULL,NULL,2,4),(62,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,96,NULL,NULL,3,5),(63,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,97,NULL,NULL,3,5),(64,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,98,NULL,NULL,1,8),(65,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,99,NULL,NULL,1,57),(66,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,100,NULL,NULL,3,63),(67,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,101,NULL,NULL,3,63),(68,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,102,NULL,NULL,8,66),(69,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,103,NULL,NULL,8,66),(70,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,104,NULL,NULL,7,68),(71,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,105,NULL,NULL,7,68),(72,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,106,NULL,NULL,9,69),(73,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,107,NULL,NULL,2,70),(74,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,108,NULL,NULL,2,71),(75,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,109,NULL,NULL,2,71),(76,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,110,NULL,NULL,2,72),(77,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,111,NULL,NULL,2,72),(78,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,112,NULL,NULL,6,73),(79,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,113,NULL,NULL,6,73),(80,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,114,NULL,NULL,2,75),(81,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,115,NULL,NULL,3,76),(82,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,116,NULL,NULL,3,76),(83,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,117,NULL,NULL,9,79),(84,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,118,NULL,NULL,9,79),(85,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,119,NULL,NULL,12,80),(86,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,120,NULL,NULL,12,80),(87,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,121,NULL,NULL,14,81),(88,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,122,NULL,NULL,13,82),(89,2,'2026-05-06 13:53:15.000000',_binary '',NULL,'2026-05-06','INITIAL',NULL,NULL,NULL,NULL,123,NULL,NULL,14,83),(90,2,'2026-05-11 06:56:38.816338',_binary '',NULL,'2026-05-11','INITIAL',NULL,NULL,NULL,NULL,124,NULL,NULL,2,4);
/*!40000 ALTER TABLE `employee_department_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_import_session`
--

DROP TABLE IF EXISTS `employee_import_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_import_session` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `committed` bit(1) NOT NULL,
  `committed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by_user_id` bigint DEFAULT NULL,
  `error_file_path` varchar(1024) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `invalid_rows` int DEFAULT NULL,
  `total_rows` int DEFAULT NULL,
  `valid_rows` int DEFAULT NULL,
  `validation_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf17lgro6somtvye0omuw7exha` (`validation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_import_session`
--

LOCK TABLES `employee_import_session` WRITE;
/*!40000 ALTER TABLE `employee_import_session` DISABLE KEYS */;
INSERT INTO `employee_import_session` VALUES (1,_binary '\0',NULL,'2026-04-23 06:49:40.415207',2,'C:\\Users\\PYAEPH~1\\AppData\\Local\\Temp\\epms-import-errors\\import_errors_8208ac54-f6d0-4eeb-b3af-bf80868d88fc.xlsx','employee_import_template (22).xlsx',2,2,0,'8208ac54-f6d0-4eeb-b3af-bf80868d88fc'),(2,_binary '\0',NULL,'2026-04-23 09:36:39.243351',2,'C:\\Users\\PYAEPH~1\\AppData\\Local\\Temp\\epms-import-errors\\import_errors_e1719e4d-15f7-46e8-8953-151c02687718.xlsx','employee_import_template (22).xlsx',2,2,0,'e1719e4d-15f7-46e8-8953-151c02687718'),(3,_binary '','2026-04-23 09:38:33.805917','2026-04-23 09:38:05.923406',2,NULL,'employee_import_template (22).xlsx',0,2,2,'b1290871-1333-4977-b699-2aea1b9932c8'),(4,_binary '\0',NULL,'2026-04-23 11:07:45.086135',2,NULL,'employee_import_template (23).xlsx',0,1,1,'198ae53c-0711-4900-a970-35966e7ec658'),(5,_binary '\0',NULL,'2026-04-23 11:31:09.946365',2,NULL,'employee_import_template (23).xlsx',0,1,1,'03405fdd-9446-479f-bc50-cca4a1060fdc'),(6,_binary '','2026-04-23 17:39:27.694850','2026-04-23 17:39:13.293877',2,NULL,'employee_import_template (23).xlsx',0,1,1,'cea6bd29-1640-4ff6-8131-b9e5553737ea');
/*!40000 ALTER TABLE `employee_import_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_import_session_item`
--

DROP TABLE IF EXISTS `employee_import_session_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_import_session_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `error_messages_json` text,
  `row_data_json` text,
  `row_number` int NOT NULL,
  `session_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_import_session_item`
--

LOCK TABLES `employee_import_session_item` WRITE;
/*!40000 ALTER TABLE `employee_import_session_item` DISABLE KEYS */;
INSERT INTO `employee_import_session_item` VALUES (1,'[\"hire_date is required\"]','{\"staffNo\":\"27\",\"fullName\":\"Aung Kaung Myat\",\"staffNrcNo\":\"7/NYALAPA(N)012390\",\"email\":\"test1one@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Software Engineer\",\"phoneNumber\":\"095057863\",\"gender\":\"Male\",\"dateOfBirth\":\"1990-09-15\",\"hireDate\":\"\",\"staffType\":\"Probation\",\"probationStartDate\":\"2026-04-23\",\"probationEndDate\":\"2026-04-22\",\"address\":\"No 123 Boston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Father\",\"emergencyContactPhone\":\"095087532\",\"fatherName\":\"U Hla\",\"fatherNrcNo\":\"7/NYALAPA(E)321123\",\"fatherOccupation\":\"Worker\"}',2,1,'INVALID'),(2,'[\"hire_date is required\"]','{\"staffNo\":\"28\",\"fullName\":\"Ma Ma\",\"staffNrcNo\":\"7/NYALAPA(N)232390\",\"email\":\"testtwo@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Team Lead\",\"phoneNumber\":\"095057868\",\"gender\":\"Female\",\"dateOfBirth\":\"2002-03-20\",\"hireDate\":\"\",\"staffType\":\"Permanent\",\"probationStartDate\":\"\",\"probationEndDate\":\"\",\"address\":\"No 1222 Houston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Uncle\",\"emergencyContactPhone\":\"095186583\",\"fatherName\":\"U Ko Ko Oo\",\"fatherNrcNo\":\"7/NYALAPA(N)320149\",\"fatherOccupation\":\"Teacher\"}',3,1,'INVALID'),(3,'[\"hire_date is required\"]','{\"staffNo\":\"27\",\"fullName\":\"Aung Kaung Myat\",\"staffNrcNo\":\"7/NYALAPA(N)012390\",\"email\":\"test1one@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Software Engineer\",\"phoneNumber\":\"095057863\",\"gender\":\"Male\",\"dateOfBirth\":\"1990-09-15\",\"hireDate\":\"\",\"staffType\":\"Probation\",\"probationStartDate\":\"2026-04-23\",\"probationEndDate\":\"2026-04-22\",\"address\":\"No 123 Boston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Father\",\"emergencyContactPhone\":\"095087532\",\"fatherName\":\"U Hla\",\"fatherNrcNo\":\"7/NYALAPA(E)321123\",\"fatherOccupation\":\"Worker\"}',2,2,'INVALID'),(4,'[\"hire_date is required\"]','{\"staffNo\":\"28\",\"fullName\":\"Ma Ma\",\"staffNrcNo\":\"7/NYALAPA(N)232390\",\"email\":\"testtwo@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Team Lead\",\"phoneNumber\":\"095057868\",\"gender\":\"Female\",\"dateOfBirth\":\"2002-03-20\",\"hireDate\":\"\",\"staffType\":\"Permanent\",\"probationStartDate\":\"\",\"probationEndDate\":\"\",\"address\":\"No 1222 Houston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Uncle\",\"emergencyContactPhone\":\"095186583\",\"fatherName\":\"U Ko Ko Oo\",\"fatherNrcNo\":\"7/NYALAPA(N)320149\",\"fatherOccupation\":\"Teacher\"}',3,2,'INVALID'),(5,NULL,'{\"staffNo\":\"27\",\"fullName\":\"Aung Kaung Myat\",\"staffNrcNo\":\"7/NYALAPA(N)012390\",\"email\":\"test1one@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Software Engineer\",\"phoneNumber\":\"095057863\",\"gender\":\"Male\",\"dateOfBirth\":\"1990-09-15\",\"hireDate\":\"2026-04-23\",\"staffType\":\"Probation\",\"probationStartDate\":\"2026-04-23\",\"probationEndDate\":\"2026-04-22\",\"address\":\"No 123 Boston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Father\",\"emergencyContactPhone\":\"095087532\",\"fatherName\":\"U Hla\",\"fatherNrcNo\":\"7/NYALAPA(E)321123\",\"fatherOccupation\":\"Worker\"}',2,3,'IMPORTED'),(6,NULL,'{\"staffNo\":\"28\",\"fullName\":\"Ma Ma\",\"staffNrcNo\":\"7/NYALAPA(N)232390\",\"email\":\"testtwo@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Team Lead\",\"phoneNumber\":\"095057868\",\"gender\":\"Female\",\"dateOfBirth\":\"2002-03-20\",\"hireDate\":\"2026-04-23\",\"staffType\":\"Permanent\",\"probationStartDate\":\"\",\"probationEndDate\":\"\",\"address\":\"No 1222 Houston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Uncle\",\"emergencyContactPhone\":\"095186583\",\"fatherName\":\"U Ko Ko Oo\",\"fatherNrcNo\":\"7/NYALAPA(N)320149\",\"fatherOccupation\":\"Teacher\"}',3,3,'IMPORTED'),(7,NULL,'{\"staffNo\":\"\",\"fullName\":\"Aung Ko Ko\",\"staffNrcNo\":\"7/NYALAPA(N)112390\",\"email\":\"vdeltas@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Software Engineer\",\"phoneNumber\":\"095057863\",\"gender\":\"Male\",\"dateOfBirth\":\"1990-09-15\",\"hireDate\":\"2026-04-23\",\"staffType\":\"Probation\",\"probationStartDate\":\"2026-04-23\",\"probationEndDate\":\"2026-04-22\",\"address\":\"No 123 Boston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Father\",\"emergencyContactPhone\":\"095087532\",\"fatherName\":\"U Hla\",\"fatherNrcNo\":\"7/NYALAPA(E)321123\",\"fatherOccupation\":\"Worker\"}',2,4,'VALID'),(8,NULL,'{\"staffNo\":\"\",\"fullName\":\"Aung Ko Ko\",\"staffNrcNo\":\"7/NYALAPA(N)112390\",\"email\":\"vdeltas@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Software Engineer\",\"phoneNumber\":\"095057863\",\"gender\":\"Male\",\"dateOfBirth\":\"1990-09-15\",\"hireDate\":\"2026-04-23\",\"staffType\":\"Probation\",\"probationStartDate\":\"2026-04-23\",\"probationEndDate\":\"2026-04-22\",\"address\":\"No 123 Boston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Father\",\"emergencyContactPhone\":\"095087532\",\"fatherName\":\"U Hla\",\"fatherNrcNo\":\"7/NYALAPA(E)321123\",\"fatherOccupation\":\"Worker\"}',2,5,'VALID'),(9,NULL,'{\"staffNo\":\"\",\"fullName\":\"Aung Ko Ko\",\"staffNrcNo\":\"7/NYALAPA(N)112390\",\"email\":\"vdeltas@deltajohnsons.com\",\"department\":\"Engineering\",\"position\":\"Software Engineer\",\"phoneNumber\":\"095057863\",\"gender\":\"Male\",\"dateOfBirth\":\"1990-09-15\",\"hireDate\":\"2026-04-23\",\"staffType\":\"Probation\",\"probationStartDate\":\"2026-04-23\",\"probationEndDate\":\"2026-04-22\",\"address\":\"No 123 Boston\",\"nationality\":\"Myanmar\",\"employmentStatus\":\"ACTIVE\",\"religion\":\"Buddhist\",\"emergencyContactRelationship\":\"Father\",\"emergencyContactPhone\":\"095087532\",\"fatherName\":\"U Hla\",\"fatherNrcNo\":\"7/NYALAPA(E)321123\",\"fatherOccupation\":\"Worker\"}',2,6,'IMPORTED');
/*!40000 ALTER TABLE `employee_import_session_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_probation`
--

DROP TABLE IF EXISTS `employee_probation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_probation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `probation_start_date` date DEFAULT NULL,
  `probation_end_date` date DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `probation_days` int DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_probation_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_probation_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_probation`
--

LOCK TABLES `employee_probation` WRITE;
/*!40000 ALTER TABLE `employee_probation` DISABLE KEYS */;
INSERT INTO `employee_probation` VALUES (1,'2026-04-23','2026-07-23',19,90,NULL,NULL,NULL,NULL),(2,'2026-04-21','2026-04-29',21,90,NULL,NULL,2,'2026-04-29 10:16:52.424763'),(3,'2026-04-22','2026-04-28',29,90,NULL,NULL,2,'2026-04-28 09:08:45.476814'),(4,'2026-04-23','2026-04-28',33,NULL,NULL,NULL,2,'2026-04-28 09:08:41.577781'),(6,'2026-04-23','2026-04-28',36,90,2,'2026-04-23 14:32:08.437386',2,'2026-04-28 09:08:38.413205'),(7,'2026-04-23','2026-04-28',38,NULL,NULL,NULL,2,'2026-04-28 09:09:06.361306'),(8,'2026-05-06','2026-08-04',43,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(9,'2026-05-06','2026-08-04',45,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(10,'2026-05-06','2026-08-04',48,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(11,'2026-05-06','2026-08-04',51,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(12,'2026-05-06','2026-08-04',54,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(13,'2026-05-06','2026-08-04',56,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(14,'2026-05-06','2026-08-04',59,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(15,'2026-05-06','2026-08-04',62,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(16,'2026-05-06','2026-08-04',64,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(17,'2026-05-06','2026-08-04',67,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(18,'2026-05-06','2026-08-04',69,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(19,'2026-05-06','2026-08-04',73,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(20,'2026-05-06','2026-08-04',75,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(21,'2026-05-06','2026-08-04',77,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(22,'2026-05-06','2026-08-04',79,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(23,'2026-05-06','2026-08-04',82,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(24,'2026-05-06','2026-08-04',85,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(25,'2026-05-06','2026-08-04',88,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(26,'2026-05-06','2026-08-04',90,90,2,'2026-05-06 12:57:42.000000',NULL,NULL),(27,'2026-05-06','2026-08-04',95,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(28,'2026-05-06','2026-08-04',97,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(29,'2026-05-06','2026-08-04',101,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(30,'2026-05-06','2026-08-04',103,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(31,'2026-05-06','2026-08-04',111,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(32,'2026-05-06','2026-08-04',113,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(33,'2026-05-06','2026-08-04',115,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(34,'2026-05-06','2026-08-04',117,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(35,'2026-05-06','2026-08-04',118,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(36,'2026-05-06','2026-08-04',119,90,2,'2026-05-06 13:53:20.000000',NULL,NULL),(37,'2026-05-06','2026-08-04',120,90,2,'2026-05-06 13:53:20.000000',NULL,NULL);
/*!40000 ALTER TABLE `employee_probation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_reporting_history`
--

DROP TABLE IF EXISTS `employee_reporting_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_reporting_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) NOT NULL,
  `is_current` bit(1) NOT NULL,
  `effective_end_date` date DEFAULT NULL,
  `effective_start_date` date NOT NULL,
  `reason` text,
  `remarks` text,
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `manager_employee_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKt45ajb0q09o70lpx2slem84ic` (`employee_id`),
  KEY `FKfxjj3k8egfigimglcp8ot2v5i` (`manager_employee_id`),
  CONSTRAINT `FKfxjj3k8egfigimglcp8ot2v5i` FOREIGN KEY (`manager_employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKt45ajb0q09o70lpx2slem84ic` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_reporting_history`
--

LOCK TABLES `employee_reporting_history` WRITE;
/*!40000 ALTER TABLE `employee_reporting_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_reporting_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_spouse`
--

DROP TABLE IF EXISTS `employee_spouse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_spouse` (
  `spouse_id` bigint NOT NULL AUTO_INCREMENT,
  `spouse_name` varchar(100) DEFAULT NULL,
  `spouse_nrc` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`spouse_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_spouse`
--

LOCK TABLES `employee_spouse` WRITE;
/*!40000 ALTER TABLE `employee_spouse` DISABLE KEYS */;
INSERT INTO `employee_spouse` VALUES (1,'U Ko Ko','14/KaPaNa(N)154255');
/*!40000 ALTER TABLE `employee_spouse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employeekpis`
--

DROP TABLE IF EXISTS `employeekpis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeekpis` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actual` varchar(255) DEFAULT NULL,
  `category` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `period` varchar(255) NOT NULL,
  `score` decimal(38,2) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `target` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `weight` decimal(38,2) NOT NULL,
  `weighted_score` decimal(38,2) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `record_status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKhw5c1n8n33omot2evjjgkotro` (`employee_id`),
  CONSTRAINT `FKhw5c1n8n33omot2evjjgkotro` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employeekpis`
--

LOCK TABLES `employeekpis` WRITE;
/*!40000 ALTER TABLE `employeekpis` DISABLE KEYS */;
INSERT INTO `employeekpis` VALUES (1,NULL,'Compliance Management',NULL,'Testing','2026-2027',NULL,'SUBMITTED','90%','>60',NULL,40.00,NULL,5,'2026-05-05 05:19:40.857916','2026-05-05 05:19:40.857916','Active'),(2,NULL,'Team Performance',NULL,'Team','2026-2027',NULL,'SUBMITTED','30%','',NULL,20.00,NULL,5,'2026-05-05 05:19:40.859423','2026-05-05 05:19:40.859423','Active'),(3,NULL,'Financial Management',NULL,'Sonar','2026-2027',NULL,'SUBMITTED','20%','',NULL,20.00,NULL,5,'2026-05-05 05:19:40.860433','2026-05-05 05:19:40.860433','Active'),(4,NULL,'Quality Assurance',NULL,'KOKO','2026-2027',NULL,'SUBMITTED','90%','',NULL,20.00,NULL,5,'2026-05-05 05:19:40.863022','2026-05-05 05:19:40.863022','Active'),(5,NULL,'Compliance Management',NULL,'Testing','2026-2027',NULL,'SUBMITTED','90%','>60',NULL,40.00,NULL,6,'2026-05-05 05:19:40.867127','2026-05-05 05:19:40.867127','Active'),(6,NULL,'Team Performance',NULL,'Team','2026-2027',NULL,'SUBMITTED','30%','',NULL,20.00,NULL,6,'2026-05-05 05:19:40.869639','2026-05-05 05:19:40.869639','Active'),(7,NULL,'Financial Management',NULL,'Sonar','2026-2027',NULL,'SUBMITTED','20%','',NULL,20.00,NULL,6,'2026-05-05 05:19:40.871732','2026-05-05 05:19:40.871732','Active'),(8,NULL,'Quality Assurance',NULL,'KOKO','2026-2027',NULL,'SUBMITTED','90%','',NULL,20.00,NULL,6,'2026-05-05 05:19:40.873479','2026-05-05 05:19:40.873479','Active'),(9,NULL,'Compliance Management',NULL,'Testing','2026-2027',NULL,'SUBMITTED','90%','>60',NULL,40.00,NULL,7,'2026-05-05 05:19:40.876893','2026-05-05 05:19:40.876893','Active'),(10,NULL,'Team Performance',NULL,'Team','2026-2027',NULL,'SUBMITTED','30%','',NULL,20.00,NULL,7,'2026-05-05 05:19:40.878521','2026-05-05 05:19:40.878521','Active'),(11,NULL,'Financial Management',NULL,'Sonar','2026-2027',NULL,'SUBMITTED','20%','',NULL,20.00,NULL,7,'2026-05-05 05:19:40.880136','2026-05-05 05:19:40.880136','Active'),(12,NULL,'Quality Assurance',NULL,'KOKO','2026-2027',NULL,'SUBMITTED','90%','',NULL,20.00,NULL,7,'2026-05-05 05:19:40.883150','2026-05-05 05:19:40.883150','Active');
/*!40000 ALTER TABLE `employeekpis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employment_status_history`
--

DROP TABLE IF EXISTS `employment_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employment_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `previous_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) NOT NULL,
  `effective_date` date NOT NULL,
  `changed_by_user_id` bigint DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_esh_employee_id` (`employee_id`),
  KEY `idx_esh_effective_date` (`effective_date`),
  CONSTRAINT `fk_esh_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employment_status_history`
--

LOCK TABLES `employment_status_history` WRITE;
/*!40000 ALTER TABLE `employment_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `employment_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `father`
--

DROP TABLE IF EXISTS `father`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `father` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `father_name` varchar(100) DEFAULT NULL,
  `father_nrc_no` varchar(100) DEFAULT NULL,
  `father_occupation` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `father`
--

LOCK TABLES `father` WRITE;
/*!40000 ALTER TABLE `father` DISABLE KEYS */;
INSERT INTO `father` VALUES (1,'U Kyaw','12/LaKaNa(N)451320','Businessman'),(2,'U Hla','11/PaNaKa(N)015485','Engineer'),(3,'U Aung','9/KaPaTa(N)265984','Doctor'),(4,'U Ba','8/MaMaNa(N)485126','Engineer'),(5,'U Ohn','10/ThaHtaNa(N)021548','Doctor'),(6,'U Maung','12/LaMaNa(N)154812','Doctor'),(7,'U Aye','10/KaKhaMa(N)596232','Engineer'),(8,'U Khine','12/KaTaNa(N)258526','Father'),(9,'U Min','11/GaMaNa(N)651545','Businessman'),(10,'U Mya','12/DaGaTa(N)484625','Chef'),(14,'U Mya Aung','12/LaThaYa(N)021548','Cooker'),(16,'U Aung Aung','12/LaMaNa(N)424645','Doctor'),(19,'U Yaw','12/DaGaTa(N)215485','Teacher'),(20,'U Hla','7/NYALAPA(E)321123','Worker'),(21,'U Ko Ko Oo','7/NYALAPA(N)320149','Teacher'),(23,'U Ba','10/YaMaNa(N)512026','Worker'),(24,'U Po Po','12/LaThaYa(N)021541','Father'),(25,'U Hla','7/NYALAPA(E)321123','Worker'),(26,'U Min Ko','14/MaMaKa(N)154851','Boss'),(27,'U Zaw Aung','12/LaThaYa(N)014512','Gold'),(28,'U Mya Aung','12/LaThaYa(N)789012','Businessman'),(29,'U Mya Aung','12/LaThaYa(N)789012','Businessman'),(30,'U Thein Aung','12/LaMaNa(N)789456','Teacher'),(31,'U Myo Win','11/KaPaNa(N)456123','Engineer'),(32,'U Soe Moe','10/YaThaNa(N)852963','Businessman'),(33,'U Htay Lwin','9/PaTaKa(N)741852','Doctor'),(34,'U Than Htike','8/MaMaNa(N)963852','Farmer'),(35,'U Zaw Min','12/DaGaTa(N)159357','Engineer'),(36,'U Kyaw Thu','11/ThaHtaNa(N)753951','Doctor'),(37,'U Aung Myint','10/LaKaNa(N)456789','Businessman'),(38,'U Tin Maung','9/GaMaNa(N)852147','Worker'),(39,'U Win Naing','12/KaKhaMa(N)369852','Teacher'),(40,'U Win Maung','12/LaMaNa(N)852741','Teacher'),(41,'U Sein Tun','11/KaPaNa(N)963852','Engineer'),(42,'U Aung Kyaw','10/YaThaNa(N)741963','Businessman'),(43,'U Mya Win','9/PaTaKa(N)852741','Doctor'),(44,'U Than Zaw','8/MaMaNa(N)963741','Farmer'),(45,'U Htay Aung','12/DaGaTa(N)852963','Engineer'),(46,'U Kyaw Min','11/ThaHtaNa(N)741852','Doctor'),(47,'U Soe Win','10/LaKaNa(N)963741','Businessman'),(48,'U Tin Win','9/GaMaNa(N)852963','Worker'),(49,'U Zaw Tun','12/KaKhaMa(N)741852','Teacher'),(50,'U Myint Aung','12/LaMaNa(N)159753','Doctor'),(51,'U Aye Ko','11/KaPaNa(N)951753','Engineer'),(52,'U Hla Win','10/YaThaNa(N)753159','Businessman'),(53,'U Ko Lay','9/PaTaKa(N)951357','Farmer'),(54,'U Ba Than','8/MaMaNa(N)753951','Doctor'),(55,'U Maung Maung','12/DaGaTa(N)159753','Engineer'),(56,'U Kyaw Zaw','11/ThaHtaNa(N)951753','Businessman'),(57,'U Min Aung','10/LaKaNa(N)753159','Teacher'),(58,'U Thein Zaw','9/GaMaNa(N)951357','Worker'),(59,'U Htun Aung','12/KaKhaMa(N)753951','Engineer'),(60,'U Mya','12/HtaTaPa(N)158415','Boss');
/*!40000 ALTER TABLE `father` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` bigint NOT NULL AUTO_INCREMENT,
  `feedback_date` datetime(6) DEFAULT NULL,
  `remark` varchar(50) DEFAULT NULL,
  `evaluator_role` varchar(20) NOT NULL,
  `total_score` double DEFAULT NULL,
  `evaluatee_id` bigint NOT NULL,
  `evaluator_id` bigint NOT NULL,
  `anonymous` bit(1) DEFAULT NULL,
  `review_cycle_id` bigint DEFAULT NULL,
  PRIMARY KEY (`feedback_id`),
  KEY `FKo6yjtfhlhj147hc8xglmr4c6y` (`evaluatee_id`),
  KEY `FKgrp2eg0960uclxjgd5dm1u6hw` (`evaluator_id`),
  KEY `idx_feedback_review_cycle` (`review_cycle_id`),
  CONSTRAINT `FKdmln80yu9d6gdwrp0o1ahplpw` FOREIGN KEY (`review_cycle_id`) REFERENCES `review_cycles` (`id`),
  CONSTRAINT `FKgrp2eg0960uclxjgd5dm1u6hw` FOREIGN KEY (`evaluator_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKo6yjtfhlhj147hc8xglmr4c6y` FOREIGN KEY (`evaluatee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_360`
--

DROP TABLE IF EXISTS `feedback_360`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_360` (
  `feedback_id` bigint NOT NULL AUTO_INCREMENT,
  `due_date` date DEFAULT NULL,
  `assigned_date` datetime(6) DEFAULT NULL,
  `reviewer_relationship` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `submission_date` datetime(6) DEFAULT NULL,
  `target_employee_id` bigint DEFAULT NULL,
  `reviewer_id` bigint NOT NULL,
  PRIMARY KEY (`feedback_id`),
  KEY `FKjjqhk1vtyg6fet8pw7oxic4gm` (`target_employee_id`),
  KEY `FKlgqj02bff1waw4rqkrkkxgste` (`reviewer_id`),
  CONSTRAINT `FKjjqhk1vtyg6fet8pw7oxic4gm` FOREIGN KEY (`target_employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKlgqj02bff1waw4rqkrkkxgste` FOREIGN KEY (`reviewer_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_360`
--

LOCK TABLES `feedback_360` WRITE;
/*!40000 ALTER TABLE `feedback_360` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback_360` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_360_rating`
--

DROP TABLE IF EXISTS `feedback_360_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_360_rating` (
  `rating_id` bigint NOT NULL AUTO_INCREMENT,
  `comments` text,
  `created_date` datetime(6) DEFAULT NULL,
  `rating_value` int DEFAULT NULL,
  `criteria_id` bigint NOT NULL,
  `feedback_id` bigint NOT NULL,
  PRIMARY KEY (`rating_id`),
  KEY `FKs9kb1hbc9qjlo228pcc1qjno4` (`criteria_id`),
  KEY `FKi73jobn1ppr9ftf8lgi3hshs3` (`feedback_id`),
  CONSTRAINT `FKi73jobn1ppr9ftf8lgi3hshs3` FOREIGN KEY (`feedback_id`) REFERENCES `feedback_360` (`feedback_id`),
  CONSTRAINT `FKs9kb1hbc9qjlo228pcc1qjno4` FOREIGN KEY (`criteria_id`) REFERENCES `feedback_criteria` (`criteria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_360_rating`
--

LOCK TABLES `feedback_360_rating` WRITE;
/*!40000 ALTER TABLE `feedback_360_rating` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback_360_rating` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_criteria`
--

DROP TABLE IF EXISTS `feedback_criteria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_criteria` (
  `criteria_id` bigint NOT NULL AUTO_INCREMENT,
  `is_active` bit(1) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `description` text,
  `criteria_name` varchar(100) NOT NULL,
  `sort_order` int DEFAULT NULL,
  PRIMARY KEY (`criteria_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_criteria`
--

LOCK TABLES `feedback_criteria` WRITE;
/*!40000 ALTER TABLE `feedback_criteria` DISABLE KEYS */;
INSERT INTO `feedback_criteria` VALUES (1,_binary '','2026-04-20 11:44:43.111204','Ability to clearly express ideas and listen effectively','Communication Skills',1),(2,_binary '','2026-04-20 11:44:43.111204','Works well with others and contributes to team success','Teamwork & Collaboration',2),(3,_binary '','2026-04-20 11:44:43.111204','Proficiency in required technical knowledge and tools','Technical Skills',3),(4,_binary '','2026-04-20 11:44:43.111204','Delivers accurate, thorough, and high-quality work','Work Quality',4),(5,_binary '','2026-04-20 11:44:43.111204','Takes ownership of tasks and responsibilities','Accountability & Responsibility',5),(6,_binary '','2026-04-20 11:44:43.111204','Ability to analyze issues and find effective solutions','Problem Solving',6),(7,_binary '','2026-04-20 11:44:43.111204','Continuously seeks to learn and improve skills','Learning & Improvement',7),(8,_binary '','2026-04-20 11:44:43.111204','Maintains a positive attitude and professional behavior','Attitude & Professionalism',8);
/*!40000 ALTER TABLE `feedback_criteria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_detail`
--

DROP TABLE IF EXISTS `feedback_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_detail` (
  `detail_id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text,
  `rating` int NOT NULL,
  `criteria_id` bigint NOT NULL,
  `feedback_id` bigint NOT NULL,
  PRIMARY KEY (`detail_id`),
  KEY `FK2u28ih8sii0mog9sxojx2iaod` (`criteria_id`),
  KEY `FK9kdj80tqen9e7nbnj13vnk661` (`feedback_id`),
  CONSTRAINT `FK2u28ih8sii0mog9sxojx2iaod` FOREIGN KEY (`criteria_id`) REFERENCES `feedback_criteria` (`criteria_id`),
  CONSTRAINT `FK9kdj80tqen9e7nbnj13vnk661` FOREIGN KEY (`feedback_id`) REFERENCES `feedback` (`feedback_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_detail`
--

LOCK TABLES `feedback_detail` WRITE;
/*!40000 ALTER TABLE `feedback_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_draft`
--

DROP TABLE IF EXISTS `feedback_draft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_draft` (
  `draft_id` bigint NOT NULL AUTO_INCREMENT,
  `evaluator_id` bigint NOT NULL,
  `evaluatee_id` bigint NOT NULL,
  `review_cycle_id` bigint NOT NULL,
  `evaluator_role` varchar(20) NOT NULL,
  `anonymous` bit(1) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`draft_id`),
  UNIQUE KEY `uk_feedback_draft_cycle_pair_role` (`evaluator_id`,`evaluatee_id`,`review_cycle_id`,`evaluator_role`),
  KEY `idx_feedback_draft_cycle_end` (`review_cycle_id`),
  KEY `idx_feedback_draft_evaluator` (`evaluator_id`),
  KEY `FKr0vpe15xamx1gtemhx3lxefo4` (`evaluatee_id`),
  CONSTRAINT `FKio3vcq2xjibwqiwda0j7ch1n7` FOREIGN KEY (`evaluator_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKr0vpe15xamx1gtemhx3lxefo4` FOREIGN KEY (`evaluatee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKtfp4c66q1gm2iwtydy7rv9i86` FOREIGN KEY (`review_cycle_id`) REFERENCES `review_cycles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_draft`
--

LOCK TABLES `feedback_draft` WRITE;
/*!40000 ALTER TABLE `feedback_draft` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback_draft` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_draft_detail`
--

DROP TABLE IF EXISTS `feedback_draft_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_draft_detail` (
  `detail_id` bigint NOT NULL AUTO_INCREMENT,
  `draft_id` bigint NOT NULL,
  `criteria_id` bigint NOT NULL,
  `rating` int DEFAULT NULL,
  `comment` text,
  PRIMARY KEY (`detail_id`),
  KEY `idx_feedback_draft_detail_draft` (`draft_id`),
  KEY `idx_feedback_draft_detail_criteria` (`criteria_id`),
  CONSTRAINT `FKj4gsi2hvg960aoy9h69sjxhuq` FOREIGN KEY (`criteria_id`) REFERENCES `feedback_criteria` (`criteria_id`),
  CONSTRAINT `FKmot2lfvbfn8cj30m1q80syscj` FOREIGN KEY (`draft_id`) REFERENCES `feedback_draft` (`draft_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_draft_detail`
--

LOCK TABLES `feedback_draft_detail` WRITE;
/*!40000 ALTER TABLE `feedback_draft_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback_draft_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kpi_categories`
--

DROP TABLE IF EXISTS `kpi_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK2v73jpxwu2c75466xl6w0xwre` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kpi_categories`
--

LOCK TABLES `kpi_categories` WRITE;
/*!40000 ALTER TABLE `kpi_categories` DISABLE KEYS */;
INSERT INTO `kpi_categories` VALUES (1,NULL,'2026-05-01 12:43:45.897204',NULL,'Delivery Performance','Active',NULL,NULL),(2,NULL,'2026-05-01 12:43:45.911285',NULL,'Financial Management','Active',NULL,NULL),(3,NULL,'2026-05-01 12:43:45.915552',NULL,'Quality Assurance','Active',NULL,NULL),(4,NULL,'2026-05-01 12:43:45.920019',NULL,'Stakeholder Satisfaction','Active',NULL,NULL),(5,NULL,'2026-05-01 12:43:45.924376',NULL,'Team Performance','Active',NULL,NULL),(6,NULL,'2026-05-01 12:43:45.927656',NULL,'Compliance Management','Active',NULL,NULL);
/*!40000 ALTER TABLE `kpi_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kpi_template_items`
--

DROP TABLE IF EXISTS `kpi_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_template_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `target` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `weight` decimal(38,2) NOT NULL,
  `template_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjtvpclxf1i85g7wqfiob777r2` (`template_id`),
  CONSTRAINT `FKjtvpclxf1i85g7wqfiob777r2` FOREIGN KEY (`template_id`) REFERENCES `kpi_templates` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kpi_template_items`
--

LOCK TABLES `kpi_template_items` WRITE;
/*!40000 ALTER TABLE `kpi_template_items` DISABLE KEYS */;
INSERT INTO `kpi_template_items` VALUES (1,'Performance','Quantity of Work','100%','Percentage',40.00,1),(2,'Performance','Quality of Work','Zero Errors','Rating',40.00,1),(3,'Behavioral','Attendance & Punctuality','95%','Percentage',20.00,1),(4,'Operations','System Uptime','99.9%','Percentage',60.00,2),(5,'Governance','Security Compliance','100%','Percentage',40.00,2),(6,'Compliance Management','Testing','90%','>60',40.00,3),(7,'Team Performance','Team','30%','',20.00,3),(8,'Financial Management','Sonar','20%','',20.00,3),(9,'Quality Assurance','KOKO','90%','',20.00,3);
/*!40000 ALTER TABLE `kpi_template_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kpi_templates`
--

DROP TABLE IF EXISTS `kpi_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `department_id` bigint DEFAULT NULL,
  `template_name` varchar(255) NOT NULL,
  `position_id` bigint DEFAULT NULL,
  `template_type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kpi_templates`
--

LOCK TABLES `kpi_templates` WRITE;
/*!40000 ALTER TABLE `kpi_templates` DISABLE KEYS */;
INSERT INTO `kpi_templates` VALUES (1,NULL,'Standard Employee Template',NULL,'INDIVIDUAL'),(2,NULL,'IT Department Core KPIs',NULL,'DEPARTMENT'),(3,2,'Testing',4,'POSITION');
/*!40000 ALTER TABLE `kpi_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `level_code`
--

DROP TABLE IF EXISTS `level_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `level_code` (
  `level_code_id` bigint NOT NULL AUTO_INCREMENT,
  `level_code` varchar(10) DEFAULT NULL,
  `description` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`level_code_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `level_code`
--

LOCK TABLES `level_code` WRITE;
/*!40000 ALTER TABLE `level_code` DISABLE KEYS */;
INSERT INTO `level_code` VALUES (1,'L01',NULL),(2,'L02',NULL),(3,'L03',NULL),(4,'L04',NULL),(5,'L05',NULL),(6,'L06',NULL),(7,'L07',NULL),(8,'L08',NULL),(9,'L09',NULL);
/*!40000 ALTER TABLE `level_code` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting`
--

DROP TABLE IF EXISTS `meeting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting` (
  `meeting_id` bigint NOT NULL AUTO_INCREMENT,
  `actual_end_time` datetime(6) DEFAULT NULL,
  `actual_start_time` datetime(6) DEFAULT NULL,
  `cancellation_reason` text,
  `created_date` datetime(6) NOT NULL,
  `description` text,
  `duration_minutes` int NOT NULL,
  `five_min_reminder_sent` bit(1) DEFAULT NULL,
  `morning_reminder_sent` bit(1) DEFAULT NULL,
  `proposed_time` datetime(6) DEFAULT NULL,
  `reschedule_reason` text,
  `scheduled_time` datetime(6) NOT NULL,
  `status` enum('ACCEPTED','CANCELLED','CANCEL_REQUESTED','COMPLETED','ONGOING','PENDING','RESCHEDULE_MGR','RESCHEDULE_REQUESTED') NOT NULL,
  `summary_notes` text,
  `title` varchar(255) NOT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `manager_id` bigint NOT NULL,
  PRIMARY KEY (`meeting_id`),
  KEY `FKakxd2jg5ti8h5sbkwo5pmaerh` (`employee_id`),
  KEY `FKsi5g2958jv5decbg1u0qvlxp2` (`manager_id`),
  CONSTRAINT `FKakxd2jg5ti8h5sbkwo5pmaerh` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKsi5g2958jv5decbg1u0qvlxp2` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting`
--

LOCK TABLES `meeting` WRITE;
/*!40000 ALTER TABLE `meeting` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_note`
--

DROP TABLE IF EXISTS `meeting_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_note` (
  `note_id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_date` datetime(6) NOT NULL,
  `note_type` enum('EMPLOYEE_NOTE','MANAGER_NOTE') NOT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `author_id` bigint NOT NULL,
  `meeting_id` bigint NOT NULL,
  PRIMARY KEY (`note_id`),
  KEY `FK6dmng78apqog53k8uehm32nac` (`author_id`),
  KEY `FK4edlc3obtvpm5lm6ucgknojxe` (`meeting_id`),
  CONSTRAINT `FK4edlc3obtvpm5lm6ucgknojxe` FOREIGN KEY (`meeting_id`) REFERENCES `meeting` (`meeting_id`),
  CONSTRAINT `FK6dmng78apqog53k8uehm32nac` FOREIGN KEY (`author_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_note`
--

LOCK TABLES `meeting_note` WRITE;
/*!40000 ALTER TABLE `meeting_note` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  `source` varchar(50) NOT NULL DEFAULT 'GENERAL',
  `target_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKemk6u9hjlr9y7xj43axp8q6go` (`user_id`),
  CONSTRAINT `FKemk6u9hjlr9y7xj43axp8q6go` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'2026-05-04 12:45:14.757737','A self-assessment form has been assigned to you. Deadline: 30-09-2026',_binary '','Self-Assessment Assigned',40,'SELF_ASSESSMENT_FORM',NULL),(2,'2026-05-04 12:45:14.818248','A self-assessment form has been assigned to you. Deadline: 30-09-2026',_binary '\0','Self-Assessment Assigned',39,'SELF_ASSESSMENT_FORM',NULL),(3,'2026-05-11 08:31:36.952980','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '','Self-Assessment Assigned',42,'SELF_ASSESSMENT_FORM',NULL),(4,'2026-05-11 08:31:37.016984','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '\0','Self-Assessment Assigned',7,'SELF_ASSESSMENT_FORM',NULL),(5,'2026-05-11 08:31:37.059735','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '\0','Self-Assessment Assigned',49,'SELF_ASSESSMENT_FORM',NULL),(6,'2026-05-11 08:31:37.108968','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '','Self-Assessment Assigned',94,'SELF_ASSESSMENT_FORM',NULL),(7,'2026-05-11 08:31:37.152929','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '','Self-Assessment Assigned',124,'SELF_ASSESSMENT_FORM',NULL),(8,'2026-05-11 08:31:37.194578','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '\0','Self-Assessment Assigned',6,'SELF_ASSESSMENT_FORM',NULL),(9,'2026-05-11 08:31:37.221958','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '','Self-Assessment Assigned',5,'SELF_ASSESSMENT_FORM',NULL),(10,'2026-05-11 08:31:37.254340','A self-assessment form has been assigned to you. Deadline: 15-09-2026',_binary '','Self-Assessment Assigned',47,'SELF_ASSESSMENT_FORM',NULL),(12,'2026-05-11 13:00:48.044180','Employee Kyaw Oo submitted Q1 2026 Self-Assessment Form for your review.',_binary '','Self-Assessment Submitted',29,'SELF_ASSESSMENT_FORM',NULL),(13,'2026-05-11 13:42:26.305896','Your manager has reviewed your self-assessment and updated one or more scores. Please review the updated evaluation, including any manager comments, before your performance discussion.',_binary '','Manager Review Completed',124,'SELF_ASSESSMENT_FORM',5),(14,'2026-05-11 13:45:00.058048','Kyaw Oo has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',1,'SELF_ASSESSMENT_FORM',5),(15,'2026-05-11 13:45:00.061582','Kyaw Oo has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '','Self-Assessment Pending Final Approval',2,'SELF_ASSESSMENT_FORM',5),(16,'2026-05-11 13:45:00.068792','Kyaw Oo has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',12,'SELF_ASSESSMENT_FORM',5),(17,'2026-05-12 20:12:40.773997','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP created | Date/time: 13 May 2026 02:42 | PIP reference: PIP #4',_binary '','PIP Manager Action: PIP created',124,'PIP',NULL),(18,'2026-05-12 20:12:40.793595','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP created | Date/time: 13 May 2026 02:42 | PIP reference: PIP #4',_binary '\0','PIP Manager Action: PIP created',1,'PIP',NULL),(19,'2026-05-12 20:12:40.802995','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP created | Date/time: 13 May 2026 02:42 | PIP reference: PIP #4',_binary '','PIP Manager Action: PIP created',2,'PIP',NULL),(20,'2026-05-12 20:12:40.809220','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP created | Date/time: 13 May 2026 02:42 | PIP reference: PIP #4',_binary '\0','PIP Manager Action: PIP created',12,'PIP',NULL),(21,'2026-05-13 10:40:07.947658','Employee Kaung Sithu submitted Q1 2026 Self-Assessment Form for your review.',_binary '','Self-Assessment Submitted',29,'SELF_ASSESSMENT_FORM',NULL),(22,'2026-05-13 10:47:48.295797','Your manager has reviewed your self-assessment and completed the review. Please review the updated evaluation, including any manager comments, before your performance discussion.',_binary '','Manager Review Completed',94,'SELF_ASSESSMENT_FORM',4),(23,'2026-05-13 13:24:56.371661','Kaung Sithu has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',1,'SELF_ASSESSMENT_FORM',4),(24,'2026-05-13 13:24:56.385324','Kaung Sithu has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '','Self-Assessment Pending Final Approval',2,'SELF_ASSESSMENT_FORM',4),(25,'2026-05-13 13:24:56.402179','Kaung Sithu has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',12,'SELF_ASSESSMENT_FORM',4),(26,'2026-05-13 13:27:02.070717','Employee Moe San submitted Q1 2026 Self-Assessment Form for your review.',_binary '','Self-Assessment Submitted',29,'SELF_ASSESSMENT_FORM',NULL),(27,'2026-05-13 13:27:41.740486','Moe San\'s self-assessment for Q1 2026 Self-Assessment Form: manager completed review with no score changes. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',1,'SELF_ASSESSMENT_FORM',8),(28,'2026-05-13 13:27:41.743993','Moe San\'s self-assessment for Q1 2026 Self-Assessment Form: manager completed review with no score changes. Final HR approval is required.',_binary '','Self-Assessment Pending Final Approval',2,'SELF_ASSESSMENT_FORM',8),(29,'2026-05-13 13:27:41.745977','Moe San\'s self-assessment for Q1 2026 Self-Assessment Form: manager completed review with no score changes. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',12,'SELF_ASSESSMENT_FORM',8),(30,'2026-05-16 08:45:06.551358','Employee Aung Naing submitted Q1 2026 Self-Assessment Form for your review.',_binary '','Self-Assessment Submitted',29,'SELF_ASSESSMENT_FORM',NULL),(31,'2026-05-16 08:55:19.527880','Your manager has reviewed your self-assessment and updated one or more scores. Please review the updated evaluation, including any manager comments, before your performance discussion.',_binary '','Manager Review Completed',42,'SELF_ASSESSMENT_FORM',1),(32,'2026-05-16 08:56:03.632314','Aung Naing has disputed the manager review on Q1 2026 Self-Assessment Form. Reason: The manager\'s feedback is inaccurate or incomplete',_binary '\0','Self-Assessment Disputed',1,'SELF_ASSESSMENT_FORM',1),(33,'2026-05-16 08:56:03.637547','Aung Naing has disputed the manager review on Q1 2026 Self-Assessment Form. Reason: The manager\'s feedback is inaccurate or incomplete',_binary '','Self-Assessment Disputed',2,'SELF_ASSESSMENT_FORM',1),(34,'2026-05-16 08:56:03.647925','Aung Naing has disputed the manager review on Q1 2026 Self-Assessment Form. Reason: The manager\'s feedback is inaccurate or incomplete',_binary '\0','Self-Assessment Disputed',12,'SELF_ASSESSMENT_FORM',1),(35,'2026-05-16 08:56:45.137584','Manager revision is required for Aung Naing\'s Q1 2026 Self-Assessment Form. Employee dispute reason: The manager\'s feedback is inaccurate or incomplete. HR return reason: Please revise again.',_binary '','Self-Assessment Review Returned',29,'SELF_ASSESSMENT_FORM',1),(36,'2026-05-16 09:45:44.137977','Your manager has reviewed your self-assessment and updated one or more scores. Please review the updated evaluation, including any manager comments, before your performance discussion.',_binary '','Manager Review Completed',42,'SELF_ASSESSMENT_FORM',1),(37,'2026-05-16 09:47:58.737516','Aung Naing has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',1,'SELF_ASSESSMENT_FORM',1),(38,'2026-05-16 09:47:58.743667','Aung Naing has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '','Self-Assessment Pending Final Approval',2,'SELF_ASSESSMENT_FORM',1),(39,'2026-05-16 09:47:58.755893','Aung Naing has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',12,'SELF_ASSESSMENT_FORM',1),(40,'2026-05-16 12:31:32.746557','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP auto-close | Date/time: 16 May 2026 19:01 | PIP reference: PIP #4',_binary '\0','PIP Manager Action: PIP auto-close',124,'PIP',NULL),(41,'2026-05-16 12:31:32.756571','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP auto-close | Date/time: 16 May 2026 19:01 | PIP reference: PIP #4',_binary '\0','PIP Manager Action: PIP auto-close',1,'PIP',NULL),(42,'2026-05-16 12:31:32.762716','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP auto-close | Date/time: 16 May 2026 19:01 | PIP reference: PIP #4',_binary '','PIP Manager Action: PIP auto-close',2,'PIP',NULL),(43,'2026-05-16 12:31:32.768234','Employee: Kyaw Oo | Manager: Min Min Tun | Manager action: PIP auto-close | Date/time: 16 May 2026 19:01 | PIP reference: PIP #4',_binary '\0','PIP Manager Action: PIP auto-close',12,'PIP',NULL),(44,'2026-05-16 15:07:56.750319','Employee Mike Chen submitted Q1 2026 Self-Assessment Form for your review.',_binary '','Self-Assessment Submitted',29,'SELF_ASSESSMENT_FORM',NULL),(45,'2026-05-16 16:32:54.007313','Your manager has reviewed your self-assessment and updated one or more scores. Please review the updated evaluation, including any manager comments, before your performance discussion.',_binary '','Manager Review Completed',5,'SELF_ASSESSMENT_FORM',7),(46,'2026-05-16 16:34:03.153768','Mike Chen has disputed the manager review on Q1 2026 Self-Assessment Form. Reason: I disagree with the revised scores',_binary '\0','Self-Assessment Disputed',1,'SELF_ASSESSMENT_FORM',7),(47,'2026-05-16 16:34:03.160854','Mike Chen has disputed the manager review on Q1 2026 Self-Assessment Form. Reason: I disagree with the revised scores',_binary '','Self-Assessment Disputed',2,'SELF_ASSESSMENT_FORM',7),(48,'2026-05-16 16:34:03.167291','Mike Chen has disputed the manager review on Q1 2026 Self-Assessment Form. Reason: I disagree with the revised scores',_binary '\0','Self-Assessment Disputed',12,'SELF_ASSESSMENT_FORM',7),(49,'2026-05-16 16:53:25.362555','Your manager has reviewed your self-assessment and updated one or more scores. Please review the updated evaluation, including any manager comments, before your performance discussion.',_binary '','Manager Review Completed',5,'SELF_ASSESSMENT_FORM',7),(50,'2026-05-16 16:54:33.111801','Mike Chen has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',1,'SELF_ASSESSMENT_FORM',7),(51,'2026-05-16 16:54:33.114799','Mike Chen has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '','Self-Assessment Pending Final Approval',2,'SELF_ASSESSMENT_FORM',7),(52,'2026-05-16 16:54:33.117797','Mike Chen has acknowledged the manager review for Q1 2026 Self-Assessment Form. Final HR approval is required.',_binary '\0','Self-Assessment Pending Final Approval',12,'SELF_ASSESSMENT_FORM',7);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `one_on_one_meeting`
--

DROP TABLE IF EXISTS `one_on_one_meeting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `one_on_one_meeting` (
  `meeting_id` bigint NOT NULL AUTO_INCREMENT,
  `created_date` datetime(6) DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `meeting_date` date DEFAULT NULL,
  `meeting_time` time DEFAULT NULL,
  `notes` text,
  `status` varchar(30) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `employee_id` bigint DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  PRIMARY KEY (`meeting_id`),
  KEY `FK3r423x99pp35nrji5jdecijjw` (`created_by`),
  KEY `FKjbh66ai9blfehip7intq2j47y` (`employee_id`),
  KEY `FK8qaq7m7kgu7syx86f3ml1j0f8` (`manager_id`),
  CONSTRAINT `FK3r423x99pp35nrji5jdecijjw` FOREIGN KEY (`created_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FK8qaq7m7kgu7syx86f3ml1j0f8` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKjbh66ai9blfehip7intq2j47y` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `one_on_one_meeting`
--

LOCK TABLES `one_on_one_meeting` WRITE;
/*!40000 ALTER TABLE `one_on_one_meeting` DISABLE KEYS */;
/*!40000 ALTER TABLE `one_on_one_meeting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_otp`
--

DROP TABLE IF EXISTS `password_reset_otp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_otp` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_active` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `otp_code` varchar(255) NOT NULL,
  `resend_count` int NOT NULL,
  `is_used` bit(1) NOT NULL,
  `is_verified` bit(1) NOT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_prot_email` (`email`),
  KEY `idx_prot_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_otp`
--

LOCK TABLES `password_reset_otp` WRITE;
/*!40000 ALTER TABLE `password_reset_otp` DISABLE KEYS */;
INSERT INTO `password_reset_otp` VALUES (1,_binary '\0','2026-04-21 19:53:50.526676','tylertyrell6@gmail.com','2026-04-21 19:58:50.526676','531814',0,_binary '\0',_binary '','2026-04-21 19:54:18.437914'),(2,_binary '','2026-04-21 19:55:42.279994','tyrelltyler6@gmail.com','2026-04-21 20:00:42.279994','581432',0,_binary '\0',_binary '\0',NULL),(3,_binary '\0','2026-04-21 20:52:07.869579','tylertyrell6@gmail.com','2026-04-21 20:57:07.869579','492606',0,_binary '\0',_binary '\0',NULL),(4,_binary '\0','2026-04-21 20:53:31.169781','tylertyrell6@gmail.com','2026-04-21 20:58:31.169781','536723',0,_binary '\0',_binary '\0',NULL),(5,_binary '','2026-04-21 20:55:29.967754','tylertyrell6@gmail.com','2026-04-21 21:00:29.967754','310078',0,_binary '\0',_binary '\0',NULL),(6,_binary '\0','2026-04-21 20:55:49.824267','phyomin@deltajohnsons.com','2026-04-21 21:00:49.824267','834339',0,_binary '',_binary '','2026-04-21 20:56:37.337886');
/*!40000 ALTER TABLE `password_reset_otp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_session`
--

DROP TABLE IF EXISTS `password_reset_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_session` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `otp_session_id` varchar(255) NOT NULL,
  `is_used` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_prs_session_id` (`otp_session_id`),
  KEY `idx_prs_email` (`email`),
  KEY `idx_prs_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_session`
--

LOCK TABLES `password_reset_session` WRITE;
/*!40000 ALTER TABLE `password_reset_session` DISABLE KEYS */;
INSERT INTO `password_reset_session` VALUES (1,'2026-04-21 19:54:18.447638','tylertyrell6@gmail.com','2026-04-21 20:09:18.447638','7e1e3e3f-f7ae-473a-a037-fe6b04b07f64',_binary '\0'),(2,'2026-04-21 20:56:37.339315','phyomin@deltajohnsons.com','2026-04-21 21:11:37.339315','4579488c-3e39-414e-ac83-5b960c403ab6',_binary '');
/*!40000 ALTER TABLE `password_reset_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `performance_improvement_plan`
--

DROP TABLE IF EXISTS `performance_improvement_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `performance_improvement_plan` (
  `pip_id` bigint NOT NULL AUTO_INCREMENT,
  `actual_end_date` date DEFAULT NULL,
  `closed_date` datetime(6) DEFAULT NULL,
  `closing_remarks` text,
  `created_date` datetime(6) DEFAULT NULL,
  `target_end_date` date NOT NULL,
  `overall_progress_percentage` decimal(5,2) DEFAULT NULL,
  `reopen_reason` text,
  `reopened_date` datetime(6) DEFAULT NULL,
  `start_date` date NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `closed_by` bigint DEFAULT NULL,
  `created_by` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `manager_id` bigint NOT NULL,
  `reopened_by` bigint DEFAULT NULL,
  `completed_hours` int DEFAULT NULL,
  `total_hours` int DEFAULT NULL,
  `final_outcome` varchar(50) DEFAULT NULL,
  `review_reason` text,
  `original_end_date` date DEFAULT NULL,
  `auto_close_date` date DEFAULT NULL,
  `extended_end_date` date DEFAULT NULL,
  `final_close_date` date DEFAULT NULL,
  `reopen_decision` varchar(20) DEFAULT NULL,
  `reopen_decision_date` datetime(6) DEFAULT NULL,
  `expected_improvements` text,
  `reason_for_plan` text,
  `employee_signature` longtext,
  `employee_signature_date` datetime(6) DEFAULT NULL,
  `manager_signature` longtext,
  `manager_signature_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`pip_id`),
  KEY `FKnsrfxycx0poo4n31k5nqvxsyk` (`closed_by`),
  KEY `FKtfecr6ype7r5ie8gx5a1trs49` (`created_by`),
  KEY `FKnsxoqt89frmt55fo62hr12bv7` (`employee_id`),
  KEY `FK7u8ptbdqg3amuf4n3wu4tm1lq` (`manager_id`),
  KEY `FKnhylt11x5ghcq98x5npjpx8pr` (`reopened_by`),
  CONSTRAINT `FK7u8ptbdqg3amuf4n3wu4tm1lq` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKnhylt11x5ghcq98x5npjpx8pr` FOREIGN KEY (`reopened_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKnsrfxycx0poo4n31k5nqvxsyk` FOREIGN KEY (`closed_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKnsxoqt89frmt55fo62hr12bv7` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKtfecr6ype7r5ie8gx5a1trs49` FOREIGN KEY (`created_by`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `performance_improvement_plan`
--

LOCK TABLES `performance_improvement_plan` WRITE;
/*!40000 ALTER TABLE `performance_improvement_plan` DISABLE KEYS */;
INSERT INTO `performance_improvement_plan` VALUES (1,'2026-04-27','2026-04-27 05:13:53.139533','zzs','2026-04-27 04:54:56.892831','2026-04-30',0.00,NULL,NULL,'2026-04-28','CLOSED','2026-04-27 05:13:53.139533',2,3,33,3,NULL,0,4,'SUCCESSFUL',NULL,'2026-04-30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'2026-05-01',NULL,NULL,'2026-04-27 05:03:51.970674','2026-04-30',0.00,NULL,NULL,'2026-04-27','AUTO_CLOSED','2026-05-01 12:41:34.826586',NULL,3,38,3,NULL,0,2,NULL,NULL,'2026-04-30','2026-05-01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'2026-04-28',NULL,NULL,'2026-04-27 05:18:37.675663','2026-04-28',0.00,NULL,NULL,'2026-04-27','AUTO_CLOSED','2026-04-28 16:29:08.565765',NULL,3,33,3,NULL,0,2,NULL,NULL,'2026-04-28','2026-04-28',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'2026-05-16',NULL,NULL,'2026-05-12 20:12:40.698647','2026-05-14',0.00,NULL,NULL,'2026-05-13','AUTO_CLOSED','2026-05-16 12:31:32.728997',NULL,29,124,29,NULL,0,1,NULL,NULL,'2026-05-14','2026-05-16',NULL,NULL,NULL,NULL,'Good\nGood','Reason',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `performance_improvement_plan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periods`
--

DROP TABLE IF EXISTS `periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periods` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `end_date` date NOT NULL,
  `name` varchar(255) NOT NULL,
  `period_type` enum('ANNUAL','SEMI_ANNUAL') NOT NULL,
  `start_date` date NOT NULL,
  `time_setting_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periods`
--

LOCK TABLES `periods` WRITE;
/*!40000 ALTER TABLE `periods` DISABLE KEYS */;
/*!40000 ALTER TABLE `periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pip_communication_note`
--

DROP TABLE IF EXISTS `pip_communication_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pip_communication_note` (
  `note_id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_date` datetime(6) NOT NULL,
  `note_type` enum('COMMUNICATION','FOLLOWUP') NOT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `author_user_id` bigint NOT NULL,
  `pip_id` bigint NOT NULL,
  PRIMARY KEY (`note_id`),
  KEY `FKrl5gjohjl0dnl46k4r5vc57s5` (`author_user_id`),
  KEY `FKjc56nbl9kki6f9bb1bgfvxjga` (`pip_id`),
  CONSTRAINT `FKjc56nbl9kki6f9bb1bgfvxjga` FOREIGN KEY (`pip_id`) REFERENCES `performance_improvement_plan` (`pip_id`),
  CONSTRAINT `FKrl5gjohjl0dnl46k4r5vc57s5` FOREIGN KEY (`author_user_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pip_communication_note`
--

LOCK TABLES `pip_communication_note` WRITE;
/*!40000 ALTER TABLE `pip_communication_note` DISABLE KEYS */;
/*!40000 ALTER TABLE `pip_communication_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pip_follow_up_meeting`
--

DROP TABLE IF EXISTS `pip_follow_up_meeting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pip_follow_up_meeting` (
  `followup_id` bigint NOT NULL AUTO_INCREMENT,
  `created_date` datetime(6) DEFAULT NULL,
  `notes` text,
  `scheduled_date` date NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `meeting_id` bigint NOT NULL,
  `pip_id` bigint NOT NULL,
  `reminder_sent` bit(1) NOT NULL,
  PRIMARY KEY (`followup_id`),
  UNIQUE KEY `UKism5wcyn0gtmie212kt2rcpeq` (`meeting_id`),
  KEY `FKdwtgpjkn7mjd882ectnrlt40p` (`pip_id`),
  CONSTRAINT `FK4nrjs5anr35xru1ysaiyc77ey` FOREIGN KEY (`meeting_id`) REFERENCES `one_on_one_meeting` (`meeting_id`),
  CONSTRAINT `FKdwtgpjkn7mjd882ectnrlt40p` FOREIGN KEY (`pip_id`) REFERENCES `performance_improvement_plan` (`pip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pip_follow_up_meeting`
--

LOCK TABLES `pip_follow_up_meeting` WRITE;
/*!40000 ALTER TABLE `pip_follow_up_meeting` DISABLE KEYS */;
/*!40000 ALTER TABLE `pip_follow_up_meeting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pip_objective`
--

DROP TABLE IF EXISTS `pip_objective`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pip_objective` (
  `objective_id` bigint NOT NULL AUTO_INCREMENT,
  `created_date` datetime(6) DEFAULT NULL,
  `current_value` decimal(10,2) DEFAULT NULL,
  `due_date` date NOT NULL,
  `objective_description` text NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `target_value` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `weight_percentage` decimal(5,2) NOT NULL,
  `pip_id` bigint NOT NULL,
  PRIMARY KEY (`objective_id`),
  KEY `FK83wafb2i2yk3hrtn41w58cu38` (`pip_id`),
  CONSTRAINT `FK83wafb2i2yk3hrtn41w58cu38` FOREIGN KEY (`pip_id`) REFERENCES `performance_improvement_plan` (`pip_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pip_objective`
--

LOCK TABLES `pip_objective` WRITE;
/*!40000 ALTER TABLE `pip_objective` DISABLE KEYS */;
INSERT INTO `pip_objective` VALUES (1,NULL,0.00,'2026-04-30','Communication weak','Not_Started',100.00,NULL,NULL,100.00,1),(2,NULL,0.00,'2026-04-30','Communication weak','Not_Started',100.00,NULL,NULL,100.00,2),(3,NULL,0.00,'2026-04-28','aaa','Not_Started',100.00,NULL,NULL,100.00,3),(4,NULL,0.00,'2026-04-28','bbb','Not_Started',100.00,NULL,NULL,100.00,3),(5,NULL,0.00,'2026-04-28','ccc','Not_Started',100.00,NULL,NULL,100.00,3),(6,NULL,0.00,'2026-04-28','ddd','Not_Started',100.00,NULL,NULL,100.00,3),(7,NULL,0.00,'2026-05-14','Object1','Not_Started',100.00,NULL,NULL,50.00,4),(8,NULL,0.00,'2026-05-14','Objec2','Not_Started',100.00,NULL,NULL,50.00,4);
/*!40000 ALTER TABLE `pip_objective` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pip_progress_update`
--

DROP TABLE IF EXISTS `pip_progress_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pip_progress_update` (
  `update_id` bigint NOT NULL AUTO_INCREMENT,
  `comments` text,
  `created_date` datetime(6) DEFAULT NULL,
  `progress_value` decimal(10,2) NOT NULL,
  `update_date` date NOT NULL,
  `objective_id` bigint DEFAULT NULL,
  `pip_id` bigint NOT NULL,
  `updated_by` bigint NOT NULL,
  `previous_percentage` int DEFAULT NULL,
  `completed_hours` int DEFAULT NULL,
  PRIMARY KEY (`update_id`),
  KEY `FKr6had9v1t1tyurscp7dx8yeg3` (`objective_id`),
  KEY `FKnnw7097vt2da37mv54bij9a7k` (`pip_id`),
  KEY `FK396k4twkjxg7m9jv4hopyecac` (`updated_by`),
  CONSTRAINT `FK396k4twkjxg7m9jv4hopyecac` FOREIGN KEY (`updated_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKnnw7097vt2da37mv54bij9a7k` FOREIGN KEY (`pip_id`) REFERENCES `performance_improvement_plan` (`pip_id`),
  CONSTRAINT `FKr6had9v1t1tyurscp7dx8yeg3` FOREIGN KEY (`objective_id`) REFERENCES `pip_objective` (`objective_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pip_progress_update`
--

LOCK TABLES `pip_progress_update` WRITE;
/*!40000 ALTER TABLE `pip_progress_update` DISABLE KEYS */;
/*!40000 ALTER TABLE `pip_progress_update` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `position`
--

DROP TABLE IF EXISTS `position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `position` (
  `position_id` bigint NOT NULL AUTO_INCREMENT,
  `position_code` varchar(20) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `level_code_id` bigint DEFAULT NULL,
  `position_name` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  PRIMARY KEY (`position_id`),
  UNIQUE KEY `UKfojsnnw3tf6al8qyyu3q8qk86` (`position_code`),
  KEY `fk_level_code_idx` (`level_code_id`),
  KEY `FKdtxltxwyhckfe9i3wg0c45ih3` (`role_id`),
  CONSTRAINT `fk_level_code` FOREIGN KEY (`level_code_id`) REFERENCES `level_code` (`level_code_id`),
  CONSTRAINT `fk_position_level_code` FOREIGN KEY (`level_code_id`) REFERENCES `level_code` (`level_code_id`),
  CONSTRAINT `fk_position_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`),
  CONSTRAINT `FKdtxltxwyhckfe9i3wg0c45ih3` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `position`
--

LOCK TABLES `position` WRITE;
/*!40000 ALTER TABLE `position` DISABLE KEYS */;
INSERT INTO `position` VALUES (1,'HRM','2026-04-18 17:04:44.000000',3,'HR Manager','Active',NULL,1),(2,'HRS','2026-04-18 17:04:44.000000',5,'HR Specialist','Active',NULL,1),(3,'TL','2026-04-18 17:04:44.000000',4,'Team Lead','ACTIVE','2026-04-23 14:13:30.656419',4),(4,'SE','2026-04-18 17:04:44.000000',5,'Software Engineer','ACTIVE','2026-04-23 14:07:28.610977',4),(5,'ACC','2026-04-18 17:04:44.000000',5,'Accountant','ACTIVE','2026-04-24 15:03:52.502472',4),(6,'FM','2026-04-18 17:04:44.000000',3,'Finance Manager','Active',NULL,4),(7,'OM','2026-04-18 17:04:44.000000',3,'Operations Manager','Active',NULL,4),(8,'ED','2026-04-18 17:04:44.000000',1,'Executive Director','Active',NULL,4),(53,'CHRM','2026-04-22 13:55:37.000000',1,'CHAIRMAN','Active',NULL,1),(54,'CEO','2026-04-22 13:55:37.000000',2,'CEO','ACTIVE','2026-04-24 15:06:41.392668',1),(55,'COO','2026-04-22 13:55:37.000000',2,'COO','Active',NULL,1),(56,'GM','2026-04-22 13:55:37.000000',3,'GENERAL MANAGER','Active',NULL,2),(57,'EXTC','2026-04-22 13:55:37.000000',3,'EXTERNAL CONSULTANTS','Active',NULL,4),(58,'PSH','2026-04-22 13:55:37.000000',3,'PS HEAD','Active',NULL,4),(59,'SLH','2026-04-22 13:55:37.000000',4,'SALES HEAD','Active',NULL,4),(60,'PDH','2026-04-22 13:55:37.000000',4,'PRODUCT HEAD','Active',NULL,4),(61,'OMH','2026-04-22 13:55:37.000000',4,'OM HEAD','Active',NULL,4),(62,'MKH','2026-04-22 13:55:37.000000',4,'MARKETING HEAD','Active',NULL,4),(63,'SFO','2026-04-22 13:55:37.000000',4,'SENIOR FINANCE OFFICER','Active',NULL,4),(64,'SHO','2026-04-22 13:55:37.000000',4,'SENIOR HR OFFICER','Active',NULL,1),(65,'SAO','2026-04-22 13:55:37.000000',4,'SENIOR ADMIN OFFICER','Active',NULL,1),(66,'CLW','2026-04-22 13:55:37.000000',4,'CORPORATE LAWYER','Active',NULL,4),(67,'ACM','2026-04-22 13:55:37.000000',5,'ACCOUNT MANAGER','ACTIVE','2026-04-23 14:39:06.369887',4),(68,'PM','2026-04-22 13:55:37.000000',5,'PROJECT MANAGER','Active',NULL,4),(69,'CCS','2026-04-22 13:55:37.000000',5,'CALL CENTER SUPERVISOR','Active',NULL,4),(70,'LDS','2026-04-22 13:55:37.000000',6,'LEAD DESIGNER','Active',NULL,4),(71,'SSE','2026-04-22 13:55:37.000000',6,'SSE','Active',NULL,4),(72,'DES','2026-04-22 13:55:37.000000',6,'DESIGNER','Active',NULL,4),(73,'SLE','2026-04-22 13:55:37.000000',6,'SALES EXECUTIVE','Active',NULL,4),(74,'SLA','2026-04-22 13:55:37.000000',6,'SALES ADMIN','Active',NULL,4),(75,'TRS','2026-04-22 13:55:37.000000',6,'TRANSLATOR','ACTIVE','2026-04-23 14:13:38.949274',4),(76,'JFO','2026-04-22 13:55:37.000000',7,'JUNIOR FINANCE OFFICER','Active',NULL,4),(77,'JHO','2026-04-22 13:55:37.000000',7,'JUNIOR HR OFFICER','Active',NULL,1),(78,'JAO','2026-04-22 13:55:37.000000',7,'JUNIOR ADMIN OFFICER','Active',NULL,2),(79,'CCO','2026-04-22 13:55:37.000000',7,'CALL CENTER OFFICER','Active',NULL,4),(80,'OJT','2026-04-22 13:55:37.000000',8,'OJT','Active',NULL,4),(81,'DRV','2026-04-22 13:55:37.000000',9,'DRIVERS','Active',NULL,4),(82,'CLN','2026-04-22 13:55:37.000000',9,'CLEANERS','Active',NULL,4),(83,'SEC','2026-04-22 13:55:37.000000',9,'SECURITY','Active',NULL,4);
/*!40000 ALTER TABLE `position` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `position_kpis`
--

DROP TABLE IF EXISTS `position_kpis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `position_kpis` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(255) NOT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `period` varchar(255) NOT NULL,
  `target` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `weight` decimal(38,2) NOT NULL,
  `department_id` bigint NOT NULL,
  `position_id` bigint NOT NULL,
  `record_status` varchar(255) NOT NULL,
  `actual` varchar(255) DEFAULT NULL,
  `score` decimal(38,2) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `weighted_score` decimal(38,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKd8kiwuvk8mq6fuqsv23sgeooe` (`department_id`),
  KEY `FK1yfl44lr43e6fy46afu689578` (`position_id`),
  CONSTRAINT `FK1yfl44lr43e6fy46afu689578` FOREIGN KEY (`position_id`) REFERENCES `position` (`position_id`),
  CONSTRAINT `FKd8kiwuvk8mq6fuqsv23sgeooe` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `position_kpis`
--

LOCK TABLES `position_kpis` WRITE;
/*!40000 ALTER TABLE `position_kpis` DISABLE KEYS */;
INSERT INTO `position_kpis` VALUES (1,'Compliance Management','2026-05-05 05:19:40.785170','Testing','2026-2027','90%','>60','2026-05-05 05:19:40.785170',40.00,2,4,'Active',NULL,NULL,'',NULL),(2,'Team Performance','2026-05-05 05:19:40.826971','Team','2026-2027','30%','','2026-05-05 05:19:40.826971',20.00,2,4,'Active',NULL,NULL,'',NULL),(3,'Financial Management','2026-05-05 05:19:40.829999','Sonar','2026-2027','20%','','2026-05-05 05:19:40.829999',20.00,2,4,'Active',NULL,NULL,'',NULL),(4,'Quality Assurance','2026-05-05 05:19:40.832011','KOKO','2026-2027','90%','','2026-05-05 05:19:40.832011',20.00,2,4,'Active',NULL,NULL,'',NULL);
/*!40000 ALTER TABLE `position_kpis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_bank`
--

DROP TABLE IF EXISTS `question_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_bank` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `question_text` text NOT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime(6) DEFAULT NULL,
  `owner_role_id` bigint NOT NULL,
  `created_by_role_id` bigint DEFAULT NULL,
  `department_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_question_bank_scope` (`owner_role_id`,`department_id`,`is_active`),
  KEY `FK5qoovk4ypl79bh92m4tos7rte` (`department_id`),
  CONSTRAINT `FK5qoovk4ypl79bh92m4tos7rte` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_bank`
--

LOCK TABLES `question_bank` WRITE;
/*!40000 ALTER TABLE `question_bank` DISABLE KEYS */;
INSERT INTO `question_bank` VALUES (1,2,'2026-05-01 14:35:56.546943',_binary '','I completed my assigned tasks on time.',2,'2026-05-01 14:36:23.656335',1,1,NULL),(2,2,'2026-05-01 16:41:56.895200',_binary '','My work quality met expected standards.',2,'2026-05-01 16:43:25.290026',1,1,NULL),(3,2,'2026-05-01 16:42:01.317127',_binary '','I communicated clearly with my team.',2,'2026-05-01 16:43:22.864326',1,1,NULL),(4,2,'2026-05-01 16:42:05.934449',_binary '','I collaborated well with others.',2,'2026-05-01 16:43:20.925328',1,1,NULL),(5,2,'2026-05-01 16:42:11.408363',_binary '','I followed company rules and processes.',2,'2026-05-01 16:43:17.914892',1,1,NULL),(6,2,'2026-05-01 16:42:16.374653',_binary '','I tried to learn or improve my skills.',2,'2026-05-01 16:43:04.381495',1,1,NULL),(7,2,'2026-05-01 16:42:22.048182',_binary '','I met my goals this period.',2,'2026-05-01 16:43:01.619499',1,1,NULL),(8,2,'2026-05-01 16:42:28.535579',_binary '','I am satisfied with my performance.',2,'2026-05-04 13:15:43.948073',1,1,NULL),(9,2,'2026-05-01 16:42:35.100537',_binary '','I managed my time effectively.',2,'2026-05-01 16:42:56.660614',1,1,NULL),(10,2,'2026-05-01 16:42:53.264476',_binary '','I delivered work with minimal errors.',NULL,NULL,1,1,NULL),(11,2,'2026-05-10 07:52:57.538546',_binary '','I supported my team members.',2,'2026-05-10 07:53:01.686622',1,1,NULL),(12,2,'2026-05-10 07:53:09.537156',_binary '','I maintained a positive attitude.',NULL,NULL,1,1,NULL),(13,2,'2026-05-10 07:53:17.242325',_binary '','I was punctual and reliable.',NULL,NULL,1,1,NULL),(14,2,'2026-05-10 07:53:25.237572',_binary '','I contributed to team goals.',NULL,NULL,1,1,NULL);
/*!40000 ALTER TABLE `question_bank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `religion`
--

DROP TABLE IF EXISTS `religion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `religion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKra13dxctce8waokisi0kqxpm1` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `religion`
--

LOCK TABLES `religion` WRITE;
/*!40000 ALTER TABLE `religion` DISABLE KEYS */;
/*!40000 ALTER TABLE `religion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_cycles`
--

DROP TABLE IF EXISTS `review_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_cycles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `time_setting_id` bigint DEFAULT NULL,
  `parent_cycle_id` bigint DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `cycle_type` varchar(50) NOT NULL,
  `year_label` varchar(255) NOT NULL,
  `sequence_no` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `requires_employee_submission` bit(1) NOT NULL,
  `rollup_method` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_cycles_year_type_sequence` (`year_label`,`cycle_type`,`sequence_no`),
  KEY `FK21uq4es5sgphl039ugk8so956` (`parent_cycle_id`),
  KEY `FKisltbefncv7nbseeb3oqy62o3` (`time_setting_id`),
  CONSTRAINT `FK21uq4es5sgphl039ugk8so956` FOREIGN KEY (`parent_cycle_id`) REFERENCES `review_cycles` (`id`),
  CONSTRAINT `FKisltbefncv7nbseeb3oqy62o3` FOREIGN KEY (`time_setting_id`) REFERENCES `time_settings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_cycles`
--

LOCK TABLES `review_cycles` WRITE;
/*!40000 ALTER TABLE `review_cycles` DISABLE KEYS */;
INSERT INTO `review_cycles` VALUES (1,1,NULL,'Annual Cycle 2026-2027','ANNUAL-2026-2027-0','ANNUAL','2026-2027',0,'2026-04-01','2027-03-31',_binary '\0','AVERAGE','2026-05-01 18:53:31.895838','2026-05-17 15:23:58.230994'),(2,1,1,'Q1 2026-2027','H-2026-2027-1','SEMI_ANNUAL','2026-2027',1,'2026-04-01','2026-09-30',_binary '',NULL,'2026-05-01 18:53:31.903959','2026-05-17 15:23:58.237292'),(3,1,1,'Q2 2026-2027','H-2026-2027-2','SEMI_ANNUAL','2026-2027',2,'2026-10-01','2027-03-31',_binary '',NULL,'2026-05-01 18:53:31.908960','2026-05-17 15:23:58.240439');
/*!40000 ALTER TABLE `review_cycles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_date` datetime(6) DEFAULT NULL,
  `description` text,
  `level_restriction` varchar(20) DEFAULT NULL,
  `role_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKiubw515ff0ugtm28p8g3myt0h` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'2026-04-18 17:04:14.000000','Human Resources - Full system access','ALL','HR'),(2,'2026-04-18 17:04:14.000000','Department Head - Manage department employees','DEPARTMENT','Department Head'),(3,'2026-04-18 17:04:14.000000','Team Head - Manage team members','TEAM','Team Head'),(4,'2026-04-18 17:04:14.000000','Regular Employee - Self service only','SELF','Employee');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_form`
--

DROP TABLE IF EXISTS `self_assessment_form`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_form` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_date` datetime(6) DEFAULT NULL,
  `employee_remarks` text,
  `employee_signature_date` datetime(6) DEFAULT NULL,
  `employee_signature_id` bigint DEFAULT NULL,
  `hr_adjustment_signature_date` datetime(6) DEFAULT NULL,
  `hr_adjustment_signature_id` bigint DEFAULT NULL,
  `hr_final_signature_date` datetime(6) DEFAULT NULL,
  `hr_final_signature_id` bigint DEFAULT NULL,
  `hr_signature_date` datetime(6) DEFAULT NULL,
  `hr_signature_id` bigint DEFAULT NULL,
  `manager_comments` text,
  `manager_signature_date` datetime(6) DEFAULT NULL,
  `manager_signature_id` bigint DEFAULT NULL,
  `overall_remarks` text,
  `rating_category` varchar(255) DEFAULT NULL,
  `status` enum('DRAFT','SUBMITTED','MANAGER_REVIEWED','APPROVED','NOT_STARTED','NOT_SUBMITTED','REOPENED','PENDING_MANAGER_REVIEW','PENDING_EMPLOYEE_REVIEW','PENDING_FINAL_APPROVAL','PENDING_HR_CALIBRATION_REVIEW','FINALIZED_LOCKED') NOT NULL,
  `submitted_date` datetime(6) DEFAULT NULL,
  `total_score` double DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `cycle_id` bigint DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `manager_id` bigint DEFAULT NULL,
  `template_id` bigint NOT NULL,
  `deadline_date` date DEFAULT NULL,
  `manager_review_deadline_date` date DEFAULT NULL,
  `final_approval_deadline_date` date DEFAULT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `assigned_by` bigint DEFAULT NULL,
  `rating_system` varchar(20) NOT NULL DEFAULT 'FIVE_POINT',
  `assessment_date` date DEFAULT NULL,
  `ten_point_yes_min_rating` int NOT NULL DEFAULT '5',
  `start_date` date DEFAULT NULL,
  `manager_revised_total_score` double DEFAULT NULL,
  `final_approved_total_score` double DEFAULT NULL,
  `employee_acknowledged_at` datetime(6) DEFAULT NULL,
  `employee_disputed_at` datetime(6) DEFAULT NULL,
  `employee_dispute_reason` text,
  `hr_review_required` tinyint(1) DEFAULT NULL,
  `hr_review_reason` text,
  `requires_hr_review` tinyint(1) DEFAULT NULL,
  `affects_compensation_or_pip` tinyint(1) DEFAULT NULL,
  `company_policy_requires_hr_approval` tinyint(1) DEFAULT NULL,
  `hr_review_reason_at` datetime(6) DEFAULT NULL,
  `hr_signer_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqtncamyw0h4h6qicyhluu8am1` (`employee_id`),
  KEY `FKk55a999tu3rcushfyl0lfvyxq` (`manager_id`),
  KEY `FKbllnntywurwday9bnxcq98uly` (`template_id`),
  KEY `FKf417x5g06ynkogctr1s3v5a5a` (`cycle_id`),
  CONSTRAINT `FKbllnntywurwday9bnxcq98uly` FOREIGN KEY (`template_id`) REFERENCES `self_assessment_form_template` (`id`),
  CONSTRAINT `FKf417x5g06ynkogctr1s3v5a5a` FOREIGN KEY (`cycle_id`) REFERENCES `review_cycles` (`id`),
  CONSTRAINT `FKk55a999tu3rcushfyl0lfvyxq` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKqtncamyw0h4h6qicyhluu8am1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_form`
--

LOCK TABLES `self_assessment_form` WRITE;
/*!40000 ALTER TABLE `self_assessment_form` DISABLE KEYS */;
INSERT INTO `self_assessment_form` VALUES (1,'2026-05-11 08:31:36.699788','I am Aung Naing. I think I am honest.','2026-05-16 08:45:06.505527',14,NULL,NULL,'2026-05-16 09:48:10.840917',9,NULL,NULL,'Re-review again','2026-05-16 09:45:44.014257',10,NULL,'Meet Requirement','FINALIZED_LOCKED','2026-05-16 08:45:06.505527',62.857142857142854,'2026-05-16 09:48:10.840917',2,42,29,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT','2026-05-16',5,'2026-05-11',57.14285714285714,57.14285714285714,'2026-05-16 09:47:58.707706',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Myat noe aung'),(2,'2026-05-11 08:31:36.699788',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'DRAFT',NULL,NULL,NULL,2,7,NULL,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT',NULL,5,'2026-05-11',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'2026-05-11 08:31:36.699788',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'DRAFT',NULL,NULL,NULL,2,49,NULL,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT',NULL,5,'2026-05-11',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'2026-05-11 08:31:36.699788','This is my mark 77.1%.','2026-05-13 10:40:07.915137',12,NULL,NULL,'2026-05-16 16:02:47.654125',9,NULL,NULL,'Good no need adjust','2026-05-13 10:47:48.258145',10,NULL,'Good','FINALIZED_LOCKED','2026-05-13 10:40:07.915137',77.14285714285715,'2026-05-16 16:02:47.654125',2,94,29,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT','2026-05-13',5,'2026-05-11',77.14285714285715,77.14285714285715,'2026-05-13 13:24:56.326478',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Myat noe aung'),(5,'2026-05-11 08:31:36.699788','I am good.','2026-05-11 13:00:47.902599',11,NULL,NULL,'2026-05-11 13:53:42.694488',9,NULL,NULL,'','2026-05-11 13:42:26.280774',10,NULL,'Outstanding','FINALIZED_LOCKED','2026-05-11 13:00:47.902599',100,'2026-05-11 13:53:42.694488',2,124,29,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT','2026-05-11',5,'2026-05-11',91.42857142857143,91.42857142857143,'2026-05-11 13:45:00.013416',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Myat noe aung'),(6,'2026-05-11 08:31:36.699788',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'DRAFT',NULL,NULL,NULL,2,6,NULL,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT',NULL,5,'2026-05-11',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,'2026-05-11 08:31:36.699788','aaaa','2026-05-16 15:07:56.706505',15,'2026-05-16 16:52:25.698470',9,NULL,NULL,NULL,NULL,'','2026-05-16 16:53:25.327912',10,NULL,'Outstanding','PENDING_FINAL_APPROVAL','2026-05-16 15:07:56.706505',100,'2026-05-16 16:54:33.097790',2,5,29,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT','2026-05-16',5,'2026-05-11',84.28571428571429,NULL,'2026-05-16 16:54:33.097790',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Myat noe aung'),(8,'2026-05-11 08:31:36.699788','Moe san self','2026-05-13 13:27:02.046609',13,NULL,NULL,'2026-05-13 13:28:22.884687',9,NULL,NULL,'','2026-05-13 13:27:41.724924',10,NULL,'Good','FINALIZED_LOCKED','2026-05-13 13:27:02.046609',74.28571428571429,'2026-05-13 13:28:22.884687',2,47,29,26,'2026-09-15','2026-09-26','2026-09-30','2026-05-11 08:31:36.699788',2,'FIVE_POINT','2026-05-13',5,'2026-05-11',74.28571428571429,74.28571428571429,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Myat noe aung');
/*!40000 ALTER TABLE `self_assessment_form` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_form_adjustment`
--

DROP TABLE IF EXISTS `self_assessment_form_adjustment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_form_adjustment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adjusted_at` datetime(6) DEFAULT NULL,
  `adjusted_by` bigint DEFAULT NULL,
  `hr_decision` varchar(255) DEFAULT NULL,
  `hr_rejection_reason` text,
  `manager_comment` text,
  `original_rating` int DEFAULT NULL,
  `original_yes_no` varchar(255) DEFAULT NULL,
  `proposed_rating` int DEFAULT NULL,
  `proposed_yes_no` varchar(255) DEFAULT NULL,
  `question_text` text NOT NULL,
  `sort_order` int NOT NULL,
  `form_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3penb5fk1glluhxkfo2esmj1d` (`form_id`),
  CONSTRAINT `FK3penb5fk1glluhxkfo2esmj1d` FOREIGN KEY (`form_id`) REFERENCES `self_assessment_form` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_form_adjustment`
--

LOCK TABLES `self_assessment_form_adjustment` WRITE;
/*!40000 ALTER TABLE `self_assessment_form_adjustment` DISABLE KEYS */;
INSERT INTO `self_assessment_form_adjustment` VALUES (1,'2026-05-11 13:42:26.285788',29,NULL,NULL,'over',5,'Yes',3,'Yes','I contributed to team goals.',0,5),(2,'2026-05-11 13:42:26.291867',29,NULL,NULL,'over rated',5,'Yes',3,'Yes','I was punctual and reliable.',1,5),(3,'2026-05-11 13:42:26.293865',29,NULL,NULL,'overly rated',5,'Yes',3,'Yes','I managed my time effectively.',5,5),(4,'2026-05-16 08:55:19.514010',29,NULL,NULL,'sssss',5,'Yes',4,'Yes','I contributed to team goals.',0,1),(5,'2026-05-16 08:55:19.517517',29,NULL,NULL,'fairly',2,'No',3,'Yes','I was punctual and reliable.',1,1),(6,'2026-05-16 09:45:44.018283',29,NULL,NULL,'saa',5,'Yes',2,'No','I contributed to team goals.',0,1),(7,'2026-05-16 09:45:44.095410',29,NULL,NULL,'ddd',2,'No',1,'No','I was punctual and reliable.',1,1),(8,'2026-05-16 16:32:53.926787',29,NULL,NULL,'bad',5,'Yes',2,'No','I contributed to team goals.',0,7),(9,'2026-05-16 16:32:53.947607',29,NULL,NULL,'bad',5,'Yes',3,'Yes','I was punctual and reliable.',1,7),(10,'2026-05-16 16:32:53.947607',29,NULL,NULL,'bad',5,'Yes',2,'No','I maintained a positive attitude.',2,7),(11,'2026-05-16 16:32:53.947607',29,NULL,NULL,'bad',5,'Yes',2,'No','I supported my team members.',3,7),(12,'2026-05-16 16:32:53.947607',29,NULL,NULL,'Deliver somewhat',5,'Yes',3,'Yes','I delivered work with minimal errors.',4,7),(13,'2026-05-16 16:32:53.947607',29,NULL,NULL,'not really',5,'Yes',3,'Yes','I managed my time effectively.',5,7),(14,'2026-05-16 16:32:53.947607',29,NULL,NULL,'think so',5,'Yes',4,'Yes','I am satisfied with my performance.',6,7),(15,'2026-05-16 16:32:53.964054',29,NULL,NULL,'bbb',5,'Yes',2,'No','I met my goals this period.',7,7),(16,'2026-05-16 16:32:53.968529',29,NULL,NULL,'ddd',5,'Yes',2,'No','I followed company rules and processes.',9,7),(17,'2026-05-16 16:32:53.968529',29,NULL,NULL,'aaa',5,'Yes',4,'Yes','I collaborated well with others.',10,7),(18,'2026-05-16 16:32:53.975549',29,NULL,NULL,'ddd',5,'Yes',3,'Yes','I communicated clearly with my team.',11,7),(19,'2026-05-16 16:32:53.975549',29,NULL,NULL,'ddd',5,'Yes',4,'Yes','My work quality met expected standards.',12,7),(20,'2026-05-16 16:32:53.975549',29,NULL,NULL,'bbb',5,'Yes',2,'No','I completed my assigned tasks on time.',13,7),(21,'2026-05-16 16:53:25.327912',29,NULL,NULL,'ddd',5,'Yes',2,'No','I contributed to team goals.',0,7),(22,'2026-05-16 16:53:25.334755',29,NULL,NULL,'ddd',5,'Yes',2,'No','I was punctual and reliable.',1,7),(23,'2026-05-16 16:53:25.341291',29,NULL,NULL,'aa',5,'Yes',1,'No','I maintained a positive attitude.',2,7),(24,'2026-05-16 16:53:25.341291',29,NULL,NULL,'dd',5,'Yes',4,'Yes','I supported my team members.',3,7);
/*!40000 ALTER TABLE `self_assessment_form_adjustment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_form_answer`
--

DROP TABLE IF EXISTS `self_assessment_form_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_form_answer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hr_adjustment_approved` bit(1) DEFAULT NULL,
  `manager_proposed_comment` text,
  `manager_proposed_rating` int DEFAULT NULL,
  `manager_proposed_yes_no` varchar(255) DEFAULT NULL,
  `question_text` text NOT NULL,
  `rating` int DEFAULT NULL,
  `remarks` text,
  `sort_order` int NOT NULL,
  `yes_no_answer` varchar(255) DEFAULT NULL,
  `form_id` bigint NOT NULL,
  `final_approved_yes_no` varchar(255) DEFAULT NULL,
  `final_approved_rating` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3ly47fuwrkb6yhwgtxdhtie02` (`form_id`),
  CONSTRAINT `FK3ly47fuwrkb6yhwgtxdhtie02` FOREIGN KEY (`form_id`) REFERENCES `self_assessment_form` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_form_answer`
--

LOCK TABLES `self_assessment_form_answer` WRITE;
/*!40000 ALTER TABLE `self_assessment_form_answer` DISABLE KEYS */;
INSERT INTO `self_assessment_form_answer` VALUES (1,NULL,'saa',2,'No','I contributed to team goals.',5,'',0,'Yes',1,'No',2),(2,NULL,'ddd',1,'No','I was punctual and reliable.',2,'',1,'No',1,'No',1),(3,NULL,NULL,NULL,NULL,'I maintained a positive attitude.',3,'',2,'Yes',1,'Yes',3),(4,NULL,NULL,NULL,NULL,'I supported my team members.',2,'',3,'No',1,'No',2),(5,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',3,'',4,'Yes',1,'Yes',3),(6,NULL,NULL,NULL,NULL,'I managed my time effectively.',2,'',5,'No',1,'No',2),(7,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',3,'',6,'Yes',1,'Yes',3),(8,NULL,NULL,NULL,NULL,'I met my goals this period.',5,'',7,'Yes',1,'Yes',5),(9,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',3,'',8,'Yes',1,'Yes',3),(10,NULL,NULL,NULL,NULL,'I followed company rules and processes.',2,'',9,'No',1,'No',2),(11,NULL,NULL,NULL,NULL,'I collaborated well with others.',4,'',10,'Yes',1,'Yes',4),(12,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',3,'',11,'Yes',1,'Yes',3),(13,NULL,NULL,NULL,NULL,'My work quality met expected standards.',2,'',12,'No',1,'No',2),(14,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',5,'',13,'Yes',1,'Yes',5),(15,NULL,NULL,NULL,NULL,'I contributed to team goals.',NULL,NULL,0,NULL,2,NULL,NULL),(16,NULL,NULL,NULL,NULL,'I was punctual and reliable.',NULL,NULL,1,NULL,2,NULL,NULL),(17,NULL,NULL,NULL,NULL,'I maintained a positive attitude.',NULL,NULL,2,NULL,2,NULL,NULL),(18,NULL,NULL,NULL,NULL,'I supported my team members.',NULL,NULL,3,NULL,2,NULL,NULL),(19,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',NULL,NULL,4,NULL,2,NULL,NULL),(20,NULL,NULL,NULL,NULL,'I managed my time effectively.',NULL,NULL,5,NULL,2,NULL,NULL),(21,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',NULL,NULL,6,NULL,2,NULL,NULL),(22,NULL,NULL,NULL,NULL,'I met my goals this period.',NULL,NULL,7,NULL,2,NULL,NULL),(23,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',NULL,NULL,8,NULL,2,NULL,NULL),(24,NULL,NULL,NULL,NULL,'I followed company rules and processes.',NULL,NULL,9,NULL,2,NULL,NULL),(25,NULL,NULL,NULL,NULL,'I collaborated well with others.',NULL,NULL,10,NULL,2,NULL,NULL),(26,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',NULL,NULL,11,NULL,2,NULL,NULL),(27,NULL,NULL,NULL,NULL,'My work quality met expected standards.',NULL,NULL,12,NULL,2,NULL,NULL),(28,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',NULL,NULL,13,NULL,2,NULL,NULL),(29,NULL,NULL,NULL,NULL,'I contributed to team goals.',NULL,NULL,0,NULL,3,NULL,NULL),(30,NULL,NULL,NULL,NULL,'I was punctual and reliable.',NULL,NULL,1,NULL,3,NULL,NULL),(31,NULL,NULL,NULL,NULL,'I maintained a positive attitude.',NULL,NULL,2,NULL,3,NULL,NULL),(32,NULL,NULL,NULL,NULL,'I supported my team members.',NULL,NULL,3,NULL,3,NULL,NULL),(33,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',NULL,NULL,4,NULL,3,NULL,NULL),(34,NULL,NULL,NULL,NULL,'I managed my time effectively.',NULL,NULL,5,NULL,3,NULL,NULL),(35,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',NULL,NULL,6,NULL,3,NULL,NULL),(36,NULL,NULL,NULL,NULL,'I met my goals this period.',NULL,NULL,7,NULL,3,NULL,NULL),(37,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',NULL,NULL,8,NULL,3,NULL,NULL),(38,NULL,NULL,NULL,NULL,'I followed company rules and processes.',NULL,NULL,9,NULL,3,NULL,NULL),(39,NULL,NULL,NULL,NULL,'I collaborated well with others.',NULL,NULL,10,NULL,3,NULL,NULL),(40,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',NULL,NULL,11,NULL,3,NULL,NULL),(41,NULL,NULL,NULL,NULL,'My work quality met expected standards.',NULL,NULL,12,NULL,3,NULL,NULL),(42,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',NULL,NULL,13,NULL,3,NULL,NULL),(43,NULL,NULL,NULL,NULL,'I contributed to team goals.',5,'',0,'Yes',4,'Yes',5),(44,NULL,NULL,NULL,NULL,'I was punctual and reliable.',3,'',1,'Yes',4,'Yes',3),(45,NULL,NULL,NULL,NULL,'I maintained a positive attitude.',2,'',2,'No',4,'No',2),(46,NULL,NULL,NULL,NULL,'I supported my team members.',4,'',3,'Yes',4,'Yes',4),(47,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',5,'',4,'Yes',4,'Yes',5),(48,NULL,NULL,NULL,NULL,'I managed my time effectively.',3,'',5,'Yes',4,'Yes',3),(49,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',4,'',6,'Yes',4,'Yes',4),(50,NULL,NULL,NULL,NULL,'I met my goals this period.',4,'',7,'Yes',4,'Yes',4),(51,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',5,'',8,'Yes',4,'Yes',5),(52,NULL,NULL,NULL,NULL,'I followed company rules and processes.',3,'',9,'Yes',4,'Yes',3),(53,NULL,NULL,NULL,NULL,'I collaborated well with others.',4,'',10,'Yes',4,'Yes',4),(54,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',4,'',11,'Yes',4,'Yes',4),(55,NULL,NULL,NULL,NULL,'My work quality met expected standards.',4,'',12,'Yes',4,'Yes',4),(56,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',4,'',13,'Yes',4,'Yes',4),(57,NULL,'over',3,'Yes','I contributed to team goals.',5,'dd',0,'Yes',5,'Yes',3),(58,NULL,'over rated',3,'Yes','I was punctual and reliable.',5,'aaa',1,'Yes',5,'Yes',3),(59,NULL,NULL,NULL,NULL,'I maintained a positive attitude.',5,'',2,'Yes',5,'Yes',5),(60,NULL,NULL,NULL,NULL,'I supported my team members.',5,'',3,'Yes',5,'Yes',5),(61,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',5,'',4,'Yes',5,'Yes',5),(62,NULL,'overly rated',3,'Yes','I managed my time effectively.',5,'',5,'Yes',5,'Yes',3),(63,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',5,'',6,'Yes',5,'Yes',5),(64,NULL,NULL,NULL,NULL,'I met my goals this period.',5,'',7,'Yes',5,'Yes',5),(65,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',5,'',8,'Yes',5,'Yes',5),(66,NULL,NULL,NULL,NULL,'I followed company rules and processes.',5,'',9,'Yes',5,'Yes',5),(67,NULL,NULL,NULL,NULL,'I collaborated well with others.',5,'',10,'Yes',5,'Yes',5),(68,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',5,'',11,'Yes',5,'Yes',5),(69,NULL,NULL,NULL,NULL,'My work quality met expected standards.',5,'',12,'Yes',5,'Yes',5),(70,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',5,'',13,'Yes',5,'Yes',5),(71,NULL,NULL,NULL,NULL,'I contributed to team goals.',NULL,NULL,0,NULL,6,NULL,NULL),(72,NULL,NULL,NULL,NULL,'I was punctual and reliable.',NULL,NULL,1,NULL,6,NULL,NULL),(73,NULL,NULL,NULL,NULL,'I maintained a positive attitude.',NULL,NULL,2,NULL,6,NULL,NULL),(74,NULL,NULL,NULL,NULL,'I supported my team members.',NULL,NULL,3,NULL,6,NULL,NULL),(75,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',NULL,NULL,4,NULL,6,NULL,NULL),(76,NULL,NULL,NULL,NULL,'I managed my time effectively.',NULL,NULL,5,NULL,6,NULL,NULL),(77,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',NULL,NULL,6,NULL,6,NULL,NULL),(78,NULL,NULL,NULL,NULL,'I met my goals this period.',NULL,NULL,7,NULL,6,NULL,NULL),(79,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',NULL,NULL,8,NULL,6,NULL,NULL),(80,NULL,NULL,NULL,NULL,'I followed company rules and processes.',NULL,NULL,9,NULL,6,NULL,NULL),(81,NULL,NULL,NULL,NULL,'I collaborated well with others.',NULL,NULL,10,NULL,6,NULL,NULL),(82,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',NULL,NULL,11,NULL,6,NULL,NULL),(83,NULL,NULL,NULL,NULL,'My work quality met expected standards.',NULL,NULL,12,NULL,6,NULL,NULL),(84,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',NULL,NULL,13,NULL,6,NULL,NULL),(85,NULL,'ddd',2,'No','I contributed to team goals.',5,'',0,'Yes',7,NULL,NULL),(86,NULL,'ddd',2,'No','I was punctual and reliable.',5,'',1,'Yes',7,NULL,NULL),(87,NULL,'aa',1,'No','I maintained a positive attitude.',5,'',2,'Yes',7,NULL,NULL),(88,NULL,'dd',4,'Yes','I supported my team members.',5,'',3,'Yes',7,NULL,NULL),(89,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',5,'',4,'Yes',7,NULL,NULL),(90,NULL,NULL,NULL,NULL,'I managed my time effectively.',5,'',5,'Yes',7,NULL,NULL),(91,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',5,'',6,'Yes',7,NULL,NULL),(92,NULL,NULL,NULL,NULL,'I met my goals this period.',5,'',7,'Yes',7,NULL,NULL),(93,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',5,'',8,'Yes',7,NULL,NULL),(94,NULL,NULL,NULL,NULL,'I followed company rules and processes.',5,'',9,'Yes',7,NULL,NULL),(95,NULL,NULL,NULL,NULL,'I collaborated well with others.',5,'',10,'Yes',7,NULL,NULL),(96,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',5,'',11,'Yes',7,NULL,NULL),(97,NULL,NULL,NULL,NULL,'My work quality met expected standards.',5,'',12,'Yes',7,NULL,NULL),(98,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',5,'',13,'Yes',7,NULL,NULL),(99,NULL,NULL,NULL,NULL,'I contributed to team goals.',3,'',0,'Yes',8,'Yes',3),(100,NULL,NULL,NULL,NULL,'I was punctual and reliable.',2,'',1,'No',8,'No',2),(101,NULL,NULL,NULL,NULL,'I maintained a positive attitude.',5,'',2,'Yes',8,'Yes',5),(102,NULL,NULL,NULL,NULL,'I supported my team members.',4,'',3,'Yes',8,'Yes',4),(103,NULL,NULL,NULL,NULL,'I delivered work with minimal errors.',3,'',4,'Yes',8,'Yes',3),(104,NULL,NULL,NULL,NULL,'I managed my time effectively.',5,'',5,'Yes',8,'Yes',5),(105,NULL,NULL,NULL,NULL,'I am satisfied with my performance.',5,'',6,'Yes',8,'Yes',5),(106,NULL,NULL,NULL,NULL,'I met my goals this period.',3,'',7,'Yes',8,'Yes',3),(107,NULL,NULL,NULL,NULL,'I tried to learn or improve my skills.',3,'',8,'Yes',8,'Yes',3),(108,NULL,NULL,NULL,NULL,'I followed company rules and processes.',5,'',9,'Yes',8,'Yes',5),(109,NULL,NULL,NULL,NULL,'I collaborated well with others.',3,'',10,'Yes',8,'Yes',3),(110,NULL,NULL,NULL,NULL,'I communicated clearly with my team.',3,'',11,'Yes',8,'Yes',3),(111,NULL,NULL,NULL,NULL,'My work quality met expected standards.',4,'',12,'Yes',8,'Yes',4),(112,NULL,NULL,NULL,NULL,'I completed my assigned tasks on time.',4,'',13,'Yes',8,'Yes',4);
/*!40000 ALTER TABLE `self_assessment_form_answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_form_template`
--

DROP TABLE IF EXISTS `self_assessment_form_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_form_template` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime(6) DEFAULT NULL,
  `department_id` bigint NOT NULL,
  `position_id` bigint NOT NULL,
  `review_cycle_id` bigint DEFAULT NULL,
  `rating_system` varchar(20) NOT NULL DEFAULT 'FIVE_POINT',
  `ten_point_yes_min_rating` int NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`),
  KEY `FKqoejt64iyiegk2w95ein1xn2h` (`department_id`),
  KEY `FK1oyhmajevba2wxuutjae9juea` (`position_id`),
  KEY `FK6xhgopbhtj4m6we4nxds3d1o4` (`review_cycle_id`),
  CONSTRAINT `FK1oyhmajevba2wxuutjae9juea` FOREIGN KEY (`position_id`) REFERENCES `position` (`position_id`),
  CONSTRAINT `FK6xhgopbhtj4m6we4nxds3d1o4` FOREIGN KEY (`review_cycle_id`) REFERENCES `review_cycles` (`id`),
  CONSTRAINT `FKqoejt64iyiegk2w95ein1xn2h` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_form_template`
--

LOCK TABLES `self_assessment_form_template` WRITE;
/*!40000 ALTER TABLE `self_assessment_form_template` DISABLE KEYS */;
INSERT INTO `self_assessment_form_template` VALUES (1,2,'2026-05-10 10:25:37.009470',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,1,1,2,'FIVE_POINT',5),(2,2,'2026-05-10 10:25:37.218679',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,4,7,2,'FIVE_POINT',5),(3,2,'2026-05-10 10:25:37.315065',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,2,70,2,'FIVE_POINT',5),(4,2,'2026-05-10 10:25:37.426738',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,2,71,2,'FIVE_POINT',5),(5,2,'2026-05-10 10:25:37.563224',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,2,72,2,'FIVE_POINT',5),(6,2,'2026-05-10 10:25:37.674137',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,6,73,2,'FIVE_POINT',5),(7,2,'2026-05-10 10:25:37.773614',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,2,75,2,'FIVE_POINT',5),(8,2,'2026-05-10 10:25:37.858705',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,3,76,2,'FIVE_POINT',5),(9,2,'2026-05-10 10:25:37.945729',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,9,79,2,'FIVE_POINT',5),(10,2,'2026-05-10 10:25:38.031899',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,12,80,2,'FIVE_POINT',5),(11,2,'2026-05-10 10:25:38.106773',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,14,81,2,'FIVE_POINT',5),(12,2,'2026-05-10 10:25:38.179538',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,13,82,2,'FIVE_POINT',5),(13,2,'2026-05-10 10:25:38.252457',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,14,83,2,'FIVE_POINT',5),(14,2,'2026-05-10 10:25:38.332529',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,5,62,2,'FIVE_POINT',5),(15,2,'2026-05-10 10:25:38.428074',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,3,6,2,'FIVE_POINT',5),(16,2,'2026-05-10 10:25:38.494168',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,6,59,2,'FIVE_POINT',5),(17,2,'2026-05-10 10:25:38.553058',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,7,68,2,'FIVE_POINT',5),(18,2,'2026-05-10 10:25:38.628071',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,8,66,2,'FIVE_POINT',5),(19,2,'2026-05-10 10:25:38.718263',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,9,69,2,'FIVE_POINT',5),(20,2,'2026-05-10 10:25:38.796032',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,10,60,2,'FIVE_POINT',5),(21,2,'2026-05-10 10:25:38.876469',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,11,58,2,'FIVE_POINT',5),(22,2,'2026-05-10 10:25:38.933486',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,13,65,2,'FIVE_POINT',5),(23,2,'2026-05-10 10:25:38.999700',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,2,56,2,'FIVE_POINT',5),(24,2,'2026-05-10 10:25:39.048007',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,2,3,2,'FIVE_POINT',5),(25,2,'2026-05-10 10:25:39.098126',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,3,5,2,'FIVE_POINT',5),(26,2,'2026-05-10 10:25:39.153969',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,2,4,2,'FIVE_POINT',5),(27,2,'2026-05-10 10:25:39.205087',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,3,63,2,'FIVE_POINT',5),(28,2,'2026-05-10 10:25:39.262211',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,4,61,2,'FIVE_POINT',5),(29,2,'2026-05-10 10:25:39.315710',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,6,74,2,'FIVE_POINT',5),(30,2,'2026-05-10 10:25:39.369458',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,1,8,2,'FIVE_POINT',5),(31,2,'2026-05-10 10:25:39.426316',_binary '','Q1 2026 Self-Assessment Form',NULL,NULL,1,57,2,'FIVE_POINT',5);
/*!40000 ALTER TABLE `self_assessment_form_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_form_template_question`
--

DROP TABLE IF EXISTS `self_assessment_form_template_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_form_template_question` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_by` bigint DEFAULT NULL,
  `created_on` datetime(6) DEFAULT NULL,
  `question_text` text NOT NULL,
  `sort_order` int NOT NULL,
  `template_id` bigint NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `deleted_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcnaykwo5j81tt10kt85dynb7l` (`template_id`),
  CONSTRAINT `fk_saftq_template` FOREIGN KEY (`template_id`) REFERENCES `self_assessment_form_template` (`id`),
  CONSTRAINT `FKcnaykwo5j81tt10kt85dynb7l` FOREIGN KEY (`template_id`) REFERENCES `self_assessment_form_template` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=435 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_form_template_question`
--

LOCK TABLES `self_assessment_form_template_question` WRITE;
/*!40000 ALTER TABLE `self_assessment_form_template_question` DISABLE KEYS */;
INSERT INTO `self_assessment_form_template_question` VALUES (1,2,'2026-05-10 10:25:37.058116','I contributed to team goals.',0,1,NULL,NULL),(2,2,'2026-05-10 10:25:37.058116','I was punctual and reliable.',1,1,NULL,NULL),(3,2,'2026-05-10 10:25:37.058116','I maintained a positive attitude.',2,1,NULL,NULL),(4,2,'2026-05-10 10:25:37.058116','I supported my team members.',3,1,NULL,NULL),(5,2,'2026-05-10 10:25:37.058116','I delivered work with minimal errors.',4,1,NULL,NULL),(6,2,'2026-05-10 10:25:37.058116','I managed my time effectively.',5,1,NULL,NULL),(7,2,'2026-05-10 10:25:37.058116','I am satisfied with my performance.',6,1,NULL,NULL),(8,2,'2026-05-10 10:25:37.058116','I met my goals this period.',7,1,NULL,NULL),(9,2,'2026-05-10 10:25:37.058116','I tried to learn or improve my skills.',8,1,NULL,NULL),(10,2,'2026-05-10 10:25:37.058116','I followed company rules and processes.',9,1,NULL,NULL),(11,2,'2026-05-10 10:25:37.058116','I collaborated well with others.',10,1,NULL,NULL),(12,2,'2026-05-10 10:25:37.058116','I communicated clearly with my team.',11,1,NULL,NULL),(13,2,'2026-05-10 10:25:37.058116','My work quality met expected standards.',12,1,NULL,NULL),(14,2,'2026-05-10 10:25:37.058116','I completed my assigned tasks on time.',13,1,NULL,NULL),(15,2,'2026-05-10 10:25:37.222228','I contributed to team goals.',0,2,NULL,NULL),(16,2,'2026-05-10 10:25:37.222228','I was punctual and reliable.',1,2,NULL,NULL),(17,2,'2026-05-10 10:25:37.222228','I maintained a positive attitude.',2,2,NULL,NULL),(18,2,'2026-05-10 10:25:37.222228','I supported my team members.',3,2,NULL,NULL),(19,2,'2026-05-10 10:25:37.222228','I delivered work with minimal errors.',4,2,NULL,NULL),(20,2,'2026-05-10 10:25:37.222228','I managed my time effectively.',5,2,NULL,NULL),(21,2,'2026-05-10 10:25:37.222228','I am satisfied with my performance.',6,2,NULL,NULL),(22,2,'2026-05-10 10:25:37.222228','I met my goals this period.',7,2,NULL,NULL),(23,2,'2026-05-10 10:25:37.222228','I tried to learn or improve my skills.',8,2,NULL,NULL),(24,2,'2026-05-10 10:25:37.222228','I followed company rules and processes.',9,2,NULL,NULL),(25,2,'2026-05-10 10:25:37.222228','I collaborated well with others.',10,2,NULL,NULL),(26,2,'2026-05-10 10:25:37.222228','I communicated clearly with my team.',11,2,NULL,NULL),(27,2,'2026-05-10 10:25:37.222228','My work quality met expected standards.',12,2,NULL,NULL),(28,2,'2026-05-10 10:25:37.222228','I completed my assigned tasks on time.',13,2,NULL,NULL),(29,2,'2026-05-10 10:25:37.319582','I contributed to team goals.',0,3,NULL,NULL),(30,2,'2026-05-10 10:25:37.319582','I was punctual and reliable.',1,3,NULL,NULL),(31,2,'2026-05-10 10:25:37.319582','I maintained a positive attitude.',2,3,NULL,NULL),(32,2,'2026-05-10 10:25:37.319582','I supported my team members.',3,3,NULL,NULL),(33,2,'2026-05-10 10:25:37.319582','I delivered work with minimal errors.',4,3,NULL,NULL),(34,2,'2026-05-10 10:25:37.319582','I managed my time effectively.',5,3,NULL,NULL),(35,2,'2026-05-10 10:25:37.319582','I am satisfied with my performance.',6,3,NULL,NULL),(36,2,'2026-05-10 10:25:37.319582','I met my goals this period.',7,3,NULL,NULL),(37,2,'2026-05-10 10:25:37.319582','I tried to learn or improve my skills.',8,3,NULL,NULL),(38,2,'2026-05-10 10:25:37.319582','I followed company rules and processes.',9,3,NULL,NULL),(39,2,'2026-05-10 10:25:37.319582','I collaborated well with others.',10,3,NULL,NULL),(40,2,'2026-05-10 10:25:37.319582','I communicated clearly with my team.',11,3,NULL,NULL),(41,2,'2026-05-10 10:25:37.319582','My work quality met expected standards.',12,3,NULL,NULL),(42,2,'2026-05-10 10:25:37.319582','I completed my assigned tasks on time.',13,3,NULL,NULL),(43,2,'2026-05-10 10:25:37.430295','I contributed to team goals.',0,4,NULL,NULL),(44,2,'2026-05-10 10:25:37.430295','I was punctual and reliable.',1,4,NULL,NULL),(45,2,'2026-05-10 10:25:37.430295','I maintained a positive attitude.',2,4,NULL,NULL),(46,2,'2026-05-10 10:25:37.430295','I supported my team members.',3,4,NULL,NULL),(47,2,'2026-05-10 10:25:37.430295','I delivered work with minimal errors.',4,4,NULL,NULL),(48,2,'2026-05-10 10:25:37.430295','I managed my time effectively.',5,4,NULL,NULL),(49,2,'2026-05-10 10:25:37.430295','I am satisfied with my performance.',6,4,NULL,NULL),(50,2,'2026-05-10 10:25:37.430295','I met my goals this period.',7,4,NULL,NULL),(51,2,'2026-05-10 10:25:37.430295','I tried to learn or improve my skills.',8,4,NULL,NULL),(52,2,'2026-05-10 10:25:37.430295','I followed company rules and processes.',9,4,NULL,NULL),(53,2,'2026-05-10 10:25:37.430295','I collaborated well with others.',10,4,NULL,NULL),(54,2,'2026-05-10 10:25:37.430295','I communicated clearly with my team.',11,4,NULL,NULL),(55,2,'2026-05-10 10:25:37.430295','My work quality met expected standards.',12,4,NULL,NULL),(56,2,'2026-05-10 10:25:37.430295','I completed my assigned tasks on time.',13,4,NULL,NULL),(57,2,'2026-05-10 10:25:37.567965','I contributed to team goals.',0,5,NULL,NULL),(58,2,'2026-05-10 10:25:37.567965','I was punctual and reliable.',1,5,NULL,NULL),(59,2,'2026-05-10 10:25:37.567965','I maintained a positive attitude.',2,5,NULL,NULL),(60,2,'2026-05-10 10:25:37.567965','I supported my team members.',3,5,NULL,NULL),(61,2,'2026-05-10 10:25:37.567965','I delivered work with minimal errors.',4,5,NULL,NULL),(62,2,'2026-05-10 10:25:37.567965','I managed my time effectively.',5,5,NULL,NULL),(63,2,'2026-05-10 10:25:37.567965','I am satisfied with my performance.',6,5,NULL,NULL),(64,2,'2026-05-10 10:25:37.567965','I met my goals this period.',7,5,NULL,NULL),(65,2,'2026-05-10 10:25:37.567965','I tried to learn or improve my skills.',8,5,NULL,NULL),(66,2,'2026-05-10 10:25:37.567965','I followed company rules and processes.',9,5,NULL,NULL),(67,2,'2026-05-10 10:25:37.567965','I collaborated well with others.',10,5,NULL,NULL),(68,2,'2026-05-10 10:25:37.567965','I communicated clearly with my team.',11,5,NULL,NULL),(69,2,'2026-05-10 10:25:37.567965','My work quality met expected standards.',12,5,NULL,NULL),(70,2,'2026-05-10 10:25:37.567965','I completed my assigned tasks on time.',13,5,NULL,NULL),(71,2,'2026-05-10 10:25:37.686699','I contributed to team goals.',0,6,NULL,NULL),(72,2,'2026-05-10 10:25:37.686699','I was punctual and reliable.',1,6,NULL,NULL),(73,2,'2026-05-10 10:25:37.686699','I maintained a positive attitude.',2,6,NULL,NULL),(74,2,'2026-05-10 10:25:37.686699','I supported my team members.',3,6,NULL,NULL),(75,2,'2026-05-10 10:25:37.686699','I delivered work with minimal errors.',4,6,NULL,NULL),(76,2,'2026-05-10 10:25:37.686699','I managed my time effectively.',5,6,NULL,NULL),(77,2,'2026-05-10 10:25:37.686699','I am satisfied with my performance.',6,6,NULL,NULL),(78,2,'2026-05-10 10:25:37.686699','I met my goals this period.',7,6,NULL,NULL),(79,2,'2026-05-10 10:25:37.686699','I tried to learn or improve my skills.',8,6,NULL,NULL),(80,2,'2026-05-10 10:25:37.686699','I followed company rules and processes.',9,6,NULL,NULL),(81,2,'2026-05-10 10:25:37.686699','I collaborated well with others.',10,6,NULL,NULL),(82,2,'2026-05-10 10:25:37.686699','I communicated clearly with my team.',11,6,NULL,NULL),(83,2,'2026-05-10 10:25:37.686699','My work quality met expected standards.',12,6,NULL,NULL),(84,2,'2026-05-10 10:25:37.686699','I completed my assigned tasks on time.',13,6,NULL,NULL),(85,2,'2026-05-10 10:25:37.777040','I contributed to team goals.',0,7,NULL,NULL),(86,2,'2026-05-10 10:25:37.777040','I was punctual and reliable.',1,7,NULL,NULL),(87,2,'2026-05-10 10:25:37.777040','I maintained a positive attitude.',2,7,NULL,NULL),(88,2,'2026-05-10 10:25:37.777040','I supported my team members.',3,7,NULL,NULL),(89,2,'2026-05-10 10:25:37.777040','I delivered work with minimal errors.',4,7,NULL,NULL),(90,2,'2026-05-10 10:25:37.777040','I managed my time effectively.',5,7,NULL,NULL),(91,2,'2026-05-10 10:25:37.777040','I am satisfied with my performance.',6,7,NULL,NULL),(92,2,'2026-05-10 10:25:37.777040','I met my goals this period.',7,7,NULL,NULL),(93,2,'2026-05-10 10:25:37.777040','I tried to learn or improve my skills.',8,7,NULL,NULL),(94,2,'2026-05-10 10:25:37.777040','I followed company rules and processes.',9,7,NULL,NULL),(95,2,'2026-05-10 10:25:37.777040','I collaborated well with others.',10,7,NULL,NULL),(96,2,'2026-05-10 10:25:37.777040','I communicated clearly with my team.',11,7,NULL,NULL),(97,2,'2026-05-10 10:25:37.777040','My work quality met expected standards.',12,7,NULL,NULL),(98,2,'2026-05-10 10:25:37.777040','I completed my assigned tasks on time.',13,7,NULL,NULL),(99,2,'2026-05-10 10:25:37.862186','I contributed to team goals.',0,8,NULL,NULL),(100,2,'2026-05-10 10:25:37.862186','I was punctual and reliable.',1,8,NULL,NULL),(101,2,'2026-05-10 10:25:37.862186','I maintained a positive attitude.',2,8,NULL,NULL),(102,2,'2026-05-10 10:25:37.862186','I supported my team members.',3,8,NULL,NULL),(103,2,'2026-05-10 10:25:37.862186','I delivered work with minimal errors.',4,8,NULL,NULL),(104,2,'2026-05-10 10:25:37.862186','I managed my time effectively.',5,8,NULL,NULL),(105,2,'2026-05-10 10:25:37.862186','I am satisfied with my performance.',6,8,NULL,NULL),(106,2,'2026-05-10 10:25:37.862186','I met my goals this period.',7,8,NULL,NULL),(107,2,'2026-05-10 10:25:37.862186','I tried to learn or improve my skills.',8,8,NULL,NULL),(108,2,'2026-05-10 10:25:37.862186','I followed company rules and processes.',9,8,NULL,NULL),(109,2,'2026-05-10 10:25:37.862186','I collaborated well with others.',10,8,NULL,NULL),(110,2,'2026-05-10 10:25:37.862186','I communicated clearly with my team.',11,8,NULL,NULL),(111,2,'2026-05-10 10:25:37.862186','My work quality met expected standards.',12,8,NULL,NULL),(112,2,'2026-05-10 10:25:37.862186','I completed my assigned tasks on time.',13,8,NULL,NULL),(113,2,'2026-05-10 10:25:37.948859','I contributed to team goals.',0,9,NULL,NULL),(114,2,'2026-05-10 10:25:37.948859','I was punctual and reliable.',1,9,NULL,NULL),(115,2,'2026-05-10 10:25:37.948859','I maintained a positive attitude.',2,9,NULL,NULL),(116,2,'2026-05-10 10:25:37.948859','I supported my team members.',3,9,NULL,NULL),(117,2,'2026-05-10 10:25:37.948859','I delivered work with minimal errors.',4,9,NULL,NULL),(118,2,'2026-05-10 10:25:37.948859','I managed my time effectively.',5,9,NULL,NULL),(119,2,'2026-05-10 10:25:37.948859','I am satisfied with my performance.',6,9,NULL,NULL),(120,2,'2026-05-10 10:25:37.948859','I met my goals this period.',7,9,NULL,NULL),(121,2,'2026-05-10 10:25:37.948859','I tried to learn or improve my skills.',8,9,NULL,NULL),(122,2,'2026-05-10 10:25:37.948859','I followed company rules and processes.',9,9,NULL,NULL),(123,2,'2026-05-10 10:25:37.948859','I collaborated well with others.',10,9,NULL,NULL),(124,2,'2026-05-10 10:25:37.948859','I communicated clearly with my team.',11,9,NULL,NULL),(125,2,'2026-05-10 10:25:37.948859','My work quality met expected standards.',12,9,NULL,NULL),(126,2,'2026-05-10 10:25:37.948859','I completed my assigned tasks on time.',13,9,NULL,NULL),(127,2,'2026-05-10 10:25:38.034190','I contributed to team goals.',0,10,NULL,NULL),(128,2,'2026-05-10 10:25:38.034190','I was punctual and reliable.',1,10,NULL,NULL),(129,2,'2026-05-10 10:25:38.034190','I maintained a positive attitude.',2,10,NULL,NULL),(130,2,'2026-05-10 10:25:38.034190','I supported my team members.',3,10,NULL,NULL),(131,2,'2026-05-10 10:25:38.034190','I delivered work with minimal errors.',4,10,NULL,NULL),(132,2,'2026-05-10 10:25:38.034190','I managed my time effectively.',5,10,NULL,NULL),(133,2,'2026-05-10 10:25:38.034190','I am satisfied with my performance.',6,10,NULL,NULL),(134,2,'2026-05-10 10:25:38.034190','I met my goals this period.',7,10,NULL,NULL),(135,2,'2026-05-10 10:25:38.034190','I tried to learn or improve my skills.',8,10,NULL,NULL),(136,2,'2026-05-10 10:25:38.034190','I followed company rules and processes.',9,10,NULL,NULL),(137,2,'2026-05-10 10:25:38.034190','I collaborated well with others.',10,10,NULL,NULL),(138,2,'2026-05-10 10:25:38.034190','I communicated clearly with my team.',11,10,NULL,NULL),(139,2,'2026-05-10 10:25:38.034190','My work quality met expected standards.',12,10,NULL,NULL),(140,2,'2026-05-10 10:25:38.034190','I completed my assigned tasks on time.',13,10,NULL,NULL),(141,2,'2026-05-10 10:25:38.109603','I contributed to team goals.',0,11,NULL,NULL),(142,2,'2026-05-10 10:25:38.109603','I was punctual and reliable.',1,11,NULL,NULL),(143,2,'2026-05-10 10:25:38.109603','I maintained a positive attitude.',2,11,NULL,NULL),(144,2,'2026-05-10 10:25:38.109603','I supported my team members.',3,11,NULL,NULL),(145,2,'2026-05-10 10:25:38.109603','I delivered work with minimal errors.',4,11,NULL,NULL),(146,2,'2026-05-10 10:25:38.109603','I managed my time effectively.',5,11,NULL,NULL),(147,2,'2026-05-10 10:25:38.109603','I am satisfied with my performance.',6,11,NULL,NULL),(148,2,'2026-05-10 10:25:38.109603','I met my goals this period.',7,11,NULL,NULL),(149,2,'2026-05-10 10:25:38.109603','I tried to learn or improve my skills.',8,11,NULL,NULL),(150,2,'2026-05-10 10:25:38.109603','I followed company rules and processes.',9,11,NULL,NULL),(151,2,'2026-05-10 10:25:38.109603','I collaborated well with others.',10,11,NULL,NULL),(152,2,'2026-05-10 10:25:38.109603','I communicated clearly with my team.',11,11,NULL,NULL),(153,2,'2026-05-10 10:25:38.109603','My work quality met expected standards.',12,11,NULL,NULL),(154,2,'2026-05-10 10:25:38.109603','I completed my assigned tasks on time.',13,11,NULL,NULL),(155,2,'2026-05-10 10:25:38.181056','I contributed to team goals.',0,12,NULL,NULL),(156,2,'2026-05-10 10:25:38.181056','I was punctual and reliable.',1,12,NULL,NULL),(157,2,'2026-05-10 10:25:38.181056','I maintained a positive attitude.',2,12,NULL,NULL),(158,2,'2026-05-10 10:25:38.181056','I supported my team members.',3,12,NULL,NULL),(159,2,'2026-05-10 10:25:38.181056','I delivered work with minimal errors.',4,12,NULL,NULL),(160,2,'2026-05-10 10:25:38.181056','I managed my time effectively.',5,12,NULL,NULL),(161,2,'2026-05-10 10:25:38.181056','I am satisfied with my performance.',6,12,NULL,NULL),(162,2,'2026-05-10 10:25:38.181056','I met my goals this period.',7,12,NULL,NULL),(163,2,'2026-05-10 10:25:38.181056','I tried to learn or improve my skills.',8,12,NULL,NULL),(164,2,'2026-05-10 10:25:38.181056','I followed company rules and processes.',9,12,NULL,NULL),(165,2,'2026-05-10 10:25:38.181056','I collaborated well with others.',10,12,NULL,NULL),(166,2,'2026-05-10 10:25:38.181056','I communicated clearly with my team.',11,12,NULL,NULL),(167,2,'2026-05-10 10:25:38.181056','My work quality met expected standards.',12,12,NULL,NULL),(168,2,'2026-05-10 10:25:38.181056','I completed my assigned tasks on time.',13,12,NULL,NULL),(169,2,'2026-05-10 10:25:38.254479','I contributed to team goals.',0,13,NULL,NULL),(170,2,'2026-05-10 10:25:38.254479','I was punctual and reliable.',1,13,NULL,NULL),(171,2,'2026-05-10 10:25:38.254479','I maintained a positive attitude.',2,13,NULL,NULL),(172,2,'2026-05-10 10:25:38.254479','I supported my team members.',3,13,NULL,NULL),(173,2,'2026-05-10 10:25:38.254479','I delivered work with minimal errors.',4,13,NULL,NULL),(174,2,'2026-05-10 10:25:38.254479','I managed my time effectively.',5,13,NULL,NULL),(175,2,'2026-05-10 10:25:38.254479','I am satisfied with my performance.',6,13,NULL,NULL),(176,2,'2026-05-10 10:25:38.254479','I met my goals this period.',7,13,NULL,NULL),(177,2,'2026-05-10 10:25:38.254479','I tried to learn or improve my skills.',8,13,NULL,NULL),(178,2,'2026-05-10 10:25:38.254479','I followed company rules and processes.',9,13,NULL,NULL),(179,2,'2026-05-10 10:25:38.254479','I collaborated well with others.',10,13,NULL,NULL),(180,2,'2026-05-10 10:25:38.254479','I communicated clearly with my team.',11,13,NULL,NULL),(181,2,'2026-05-10 10:25:38.254479','My work quality met expected standards.',12,13,NULL,NULL),(182,2,'2026-05-10 10:25:38.254479','I completed my assigned tasks on time.',13,13,NULL,NULL),(183,2,'2026-05-10 10:25:38.335526','I contributed to team goals.',0,14,NULL,NULL),(184,2,'2026-05-10 10:25:38.335526','I was punctual and reliable.',1,14,NULL,NULL),(185,2,'2026-05-10 10:25:38.335526','I maintained a positive attitude.',2,14,NULL,NULL),(186,2,'2026-05-10 10:25:38.335526','I supported my team members.',3,14,NULL,NULL),(187,2,'2026-05-10 10:25:38.335526','I delivered work with minimal errors.',4,14,NULL,NULL),(188,2,'2026-05-10 10:25:38.335526','I managed my time effectively.',5,14,NULL,NULL),(189,2,'2026-05-10 10:25:38.335526','I am satisfied with my performance.',6,14,NULL,NULL),(190,2,'2026-05-10 10:25:38.335526','I met my goals this period.',7,14,NULL,NULL),(191,2,'2026-05-10 10:25:38.335526','I tried to learn or improve my skills.',8,14,NULL,NULL),(192,2,'2026-05-10 10:25:38.335526','I followed company rules and processes.',9,14,NULL,NULL),(193,2,'2026-05-10 10:25:38.335526','I collaborated well with others.',10,14,NULL,NULL),(194,2,'2026-05-10 10:25:38.335526','I communicated clearly with my team.',11,14,NULL,NULL),(195,2,'2026-05-10 10:25:38.335526','My work quality met expected standards.',12,14,NULL,NULL),(196,2,'2026-05-10 10:25:38.335526','I completed my assigned tasks on time.',13,14,NULL,NULL),(197,2,'2026-05-10 10:25:38.430602','I contributed to team goals.',0,15,NULL,NULL),(198,2,'2026-05-10 10:25:38.430602','I was punctual and reliable.',1,15,NULL,NULL),(199,2,'2026-05-10 10:25:38.430602','I maintained a positive attitude.',2,15,NULL,NULL),(200,2,'2026-05-10 10:25:38.430602','I supported my team members.',3,15,NULL,NULL),(201,2,'2026-05-10 10:25:38.430602','I delivered work with minimal errors.',4,15,NULL,NULL),(202,2,'2026-05-10 10:25:38.430602','I managed my time effectively.',5,15,NULL,NULL),(203,2,'2026-05-10 10:25:38.430602','I am satisfied with my performance.',6,15,NULL,NULL),(204,2,'2026-05-10 10:25:38.430602','I met my goals this period.',7,15,NULL,NULL),(205,2,'2026-05-10 10:25:38.430602','I tried to learn or improve my skills.',8,15,NULL,NULL),(206,2,'2026-05-10 10:25:38.430602','I followed company rules and processes.',9,15,NULL,NULL),(207,2,'2026-05-10 10:25:38.430602','I collaborated well with others.',10,15,NULL,NULL),(208,2,'2026-05-10 10:25:38.430602','I communicated clearly with my team.',11,15,NULL,NULL),(209,2,'2026-05-10 10:25:38.430602','My work quality met expected standards.',12,15,NULL,NULL),(210,2,'2026-05-10 10:25:38.430602','I completed my assigned tasks on time.',13,15,NULL,NULL),(211,2,'2026-05-10 10:25:38.497167','I contributed to team goals.',0,16,NULL,NULL),(212,2,'2026-05-10 10:25:38.497167','I was punctual and reliable.',1,16,NULL,NULL),(213,2,'2026-05-10 10:25:38.497167','I maintained a positive attitude.',2,16,NULL,NULL),(214,2,'2026-05-10 10:25:38.497167','I supported my team members.',3,16,NULL,NULL),(215,2,'2026-05-10 10:25:38.497167','I delivered work with minimal errors.',4,16,NULL,NULL),(216,2,'2026-05-10 10:25:38.497167','I managed my time effectively.',5,16,NULL,NULL),(217,2,'2026-05-10 10:25:38.497167','I am satisfied with my performance.',6,16,NULL,NULL),(218,2,'2026-05-10 10:25:38.497167','I met my goals this period.',7,16,NULL,NULL),(219,2,'2026-05-10 10:25:38.497167','I tried to learn or improve my skills.',8,16,NULL,NULL),(220,2,'2026-05-10 10:25:38.497167','I followed company rules and processes.',9,16,NULL,NULL),(221,2,'2026-05-10 10:25:38.497167','I collaborated well with others.',10,16,NULL,NULL),(222,2,'2026-05-10 10:25:38.497167','I communicated clearly with my team.',11,16,NULL,NULL),(223,2,'2026-05-10 10:25:38.497167','My work quality met expected standards.',12,16,NULL,NULL),(224,2,'2026-05-10 10:25:38.497167','I completed my assigned tasks on time.',13,16,NULL,NULL),(225,2,'2026-05-10 10:25:38.554057','I contributed to team goals.',0,17,NULL,NULL),(226,2,'2026-05-10 10:25:38.554057','I was punctual and reliable.',1,17,NULL,NULL),(227,2,'2026-05-10 10:25:38.554057','I maintained a positive attitude.',2,17,NULL,NULL),(228,2,'2026-05-10 10:25:38.554057','I supported my team members.',3,17,NULL,NULL),(229,2,'2026-05-10 10:25:38.554057','I delivered work with minimal errors.',4,17,NULL,NULL),(230,2,'2026-05-10 10:25:38.554057','I managed my time effectively.',5,17,NULL,NULL),(231,2,'2026-05-10 10:25:38.554057','I am satisfied with my performance.',6,17,NULL,NULL),(232,2,'2026-05-10 10:25:38.554057','I met my goals this period.',7,17,NULL,NULL),(233,2,'2026-05-10 10:25:38.554057','I tried to learn or improve my skills.',8,17,NULL,NULL),(234,2,'2026-05-10 10:25:38.554057','I followed company rules and processes.',9,17,NULL,NULL),(235,2,'2026-05-10 10:25:38.554057','I collaborated well with others.',10,17,NULL,NULL),(236,2,'2026-05-10 10:25:38.554057','I communicated clearly with my team.',11,17,NULL,NULL),(237,2,'2026-05-10 10:25:38.554057','My work quality met expected standards.',12,17,NULL,NULL),(238,2,'2026-05-10 10:25:38.554057','I completed my assigned tasks on time.',13,17,NULL,NULL),(239,2,'2026-05-10 10:25:38.631992','I contributed to team goals.',0,18,NULL,NULL),(240,2,'2026-05-10 10:25:38.631992','I was punctual and reliable.',1,18,NULL,NULL),(241,2,'2026-05-10 10:25:38.631992','I maintained a positive attitude.',2,18,NULL,NULL),(242,2,'2026-05-10 10:25:38.631992','I supported my team members.',3,18,NULL,NULL),(243,2,'2026-05-10 10:25:38.631992','I delivered work with minimal errors.',4,18,NULL,NULL),(244,2,'2026-05-10 10:25:38.631992','I managed my time effectively.',5,18,NULL,NULL),(245,2,'2026-05-10 10:25:38.631992','I am satisfied with my performance.',6,18,NULL,NULL),(246,2,'2026-05-10 10:25:38.631992','I met my goals this period.',7,18,NULL,NULL),(247,2,'2026-05-10 10:25:38.631992','I tried to learn or improve my skills.',8,18,NULL,NULL),(248,2,'2026-05-10 10:25:38.631992','I followed company rules and processes.',9,18,NULL,NULL),(249,2,'2026-05-10 10:25:38.631992','I collaborated well with others.',10,18,NULL,NULL),(250,2,'2026-05-10 10:25:38.631992','I communicated clearly with my team.',11,18,NULL,NULL),(251,2,'2026-05-10 10:25:38.631992','My work quality met expected standards.',12,18,NULL,NULL),(252,2,'2026-05-10 10:25:38.631992','I completed my assigned tasks on time.',13,18,NULL,NULL),(253,2,'2026-05-10 10:25:38.720997','I contributed to team goals.',0,19,NULL,NULL),(254,2,'2026-05-10 10:25:38.720997','I was punctual and reliable.',1,19,NULL,NULL),(255,2,'2026-05-10 10:25:38.720997','I maintained a positive attitude.',2,19,NULL,NULL),(256,2,'2026-05-10 10:25:38.720997','I supported my team members.',3,19,NULL,NULL),(257,2,'2026-05-10 10:25:38.720997','I delivered work with minimal errors.',4,19,NULL,NULL),(258,2,'2026-05-10 10:25:38.720997','I managed my time effectively.',5,19,NULL,NULL),(259,2,'2026-05-10 10:25:38.720997','I am satisfied with my performance.',6,19,NULL,NULL),(260,2,'2026-05-10 10:25:38.720997','I met my goals this period.',7,19,NULL,NULL),(261,2,'2026-05-10 10:25:38.720997','I tried to learn or improve my skills.',8,19,NULL,NULL),(262,2,'2026-05-10 10:25:38.720997','I followed company rules and processes.',9,19,NULL,NULL),(263,2,'2026-05-10 10:25:38.720997','I collaborated well with others.',10,19,NULL,NULL),(264,2,'2026-05-10 10:25:38.720997','I communicated clearly with my team.',11,19,NULL,NULL),(265,2,'2026-05-10 10:25:38.720997','My work quality met expected standards.',12,19,NULL,NULL),(266,2,'2026-05-10 10:25:38.720997','I completed my assigned tasks on time.',13,19,NULL,NULL),(267,2,'2026-05-10 10:25:38.798245','I contributed to team goals.',0,20,NULL,NULL),(268,2,'2026-05-10 10:25:38.798245','I was punctual and reliable.',1,20,NULL,NULL),(269,2,'2026-05-10 10:25:38.798245','I maintained a positive attitude.',2,20,NULL,NULL),(270,2,'2026-05-10 10:25:38.798245','I supported my team members.',3,20,NULL,NULL),(271,2,'2026-05-10 10:25:38.798245','I delivered work with minimal errors.',4,20,NULL,NULL),(272,2,'2026-05-10 10:25:38.798245','I managed my time effectively.',5,20,NULL,NULL),(273,2,'2026-05-10 10:25:38.798245','I am satisfied with my performance.',6,20,NULL,NULL),(274,2,'2026-05-10 10:25:38.798245','I met my goals this period.',7,20,NULL,NULL),(275,2,'2026-05-10 10:25:38.798245','I tried to learn or improve my skills.',8,20,NULL,NULL),(276,2,'2026-05-10 10:25:38.798245','I followed company rules and processes.',9,20,NULL,NULL),(277,2,'2026-05-10 10:25:38.798245','I collaborated well with others.',10,20,NULL,NULL),(278,2,'2026-05-10 10:25:38.798245','I communicated clearly with my team.',11,20,NULL,NULL),(279,2,'2026-05-10 10:25:38.798245','My work quality met expected standards.',12,20,NULL,NULL),(280,2,'2026-05-10 10:25:38.798245','I completed my assigned tasks on time.',13,20,NULL,NULL),(281,2,'2026-05-10 10:25:38.878467','I contributed to team goals.',0,21,NULL,NULL),(282,2,'2026-05-10 10:25:38.878467','I was punctual and reliable.',1,21,NULL,NULL),(283,2,'2026-05-10 10:25:38.878467','I maintained a positive attitude.',2,21,NULL,NULL),(284,2,'2026-05-10 10:25:38.878467','I supported my team members.',3,21,NULL,NULL),(285,2,'2026-05-10 10:25:38.878467','I delivered work with minimal errors.',4,21,NULL,NULL),(286,2,'2026-05-10 10:25:38.878467','I managed my time effectively.',5,21,NULL,NULL),(287,2,'2026-05-10 10:25:38.878467','I am satisfied with my performance.',6,21,NULL,NULL),(288,2,'2026-05-10 10:25:38.878467','I met my goals this period.',7,21,NULL,NULL),(289,2,'2026-05-10 10:25:38.878467','I tried to learn or improve my skills.',8,21,NULL,NULL),(290,2,'2026-05-10 10:25:38.878467','I followed company rules and processes.',9,21,NULL,NULL),(291,2,'2026-05-10 10:25:38.878467','I collaborated well with others.',10,21,NULL,NULL),(292,2,'2026-05-10 10:25:38.878467','I communicated clearly with my team.',11,21,NULL,NULL),(293,2,'2026-05-10 10:25:38.878467','My work quality met expected standards.',12,21,NULL,NULL),(294,2,'2026-05-10 10:25:38.878467','I completed my assigned tasks on time.',13,21,NULL,NULL),(295,2,'2026-05-10 10:25:38.936479','I contributed to team goals.',0,22,NULL,NULL),(296,2,'2026-05-10 10:25:38.936479','I was punctual and reliable.',1,22,NULL,NULL),(297,2,'2026-05-10 10:25:38.936479','I maintained a positive attitude.',2,22,NULL,NULL),(298,2,'2026-05-10 10:25:38.936479','I supported my team members.',3,22,NULL,NULL),(299,2,'2026-05-10 10:25:38.936479','I delivered work with minimal errors.',4,22,NULL,NULL),(300,2,'2026-05-10 10:25:38.936479','I managed my time effectively.',5,22,NULL,NULL),(301,2,'2026-05-10 10:25:38.936479','I am satisfied with my performance.',6,22,NULL,NULL),(302,2,'2026-05-10 10:25:38.936479','I met my goals this period.',7,22,NULL,NULL),(303,2,'2026-05-10 10:25:38.936479','I tried to learn or improve my skills.',8,22,NULL,NULL),(304,2,'2026-05-10 10:25:38.936479','I followed company rules and processes.',9,22,NULL,NULL),(305,2,'2026-05-10 10:25:38.936479','I collaborated well with others.',10,22,NULL,NULL),(306,2,'2026-05-10 10:25:38.936479','I communicated clearly with my team.',11,22,NULL,NULL),(307,2,'2026-05-10 10:25:38.936479','My work quality met expected standards.',12,22,NULL,NULL),(308,2,'2026-05-10 10:25:38.936479','I completed my assigned tasks on time.',13,22,NULL,NULL),(309,2,'2026-05-10 10:25:39.002715','I contributed to team goals.',0,23,NULL,NULL),(310,2,'2026-05-10 10:25:39.002715','I was punctual and reliable.',1,23,NULL,NULL),(311,2,'2026-05-10 10:25:39.002715','I maintained a positive attitude.',2,23,NULL,NULL),(312,2,'2026-05-10 10:25:39.002715','I supported my team members.',3,23,NULL,NULL),(313,2,'2026-05-10 10:25:39.002715','I delivered work with minimal errors.',4,23,NULL,NULL),(314,2,'2026-05-10 10:25:39.002715','I managed my time effectively.',5,23,NULL,NULL),(315,2,'2026-05-10 10:25:39.002715','I am satisfied with my performance.',6,23,NULL,NULL),(316,2,'2026-05-10 10:25:39.002715','I met my goals this period.',7,23,NULL,NULL),(317,2,'2026-05-10 10:25:39.002715','I tried to learn or improve my skills.',8,23,NULL,NULL),(318,2,'2026-05-10 10:25:39.002715','I followed company rules and processes.',9,23,NULL,NULL),(319,2,'2026-05-10 10:25:39.002715','I collaborated well with others.',10,23,NULL,NULL),(320,2,'2026-05-10 10:25:39.002715','I communicated clearly with my team.',11,23,NULL,NULL),(321,2,'2026-05-10 10:25:39.002715','My work quality met expected standards.',12,23,NULL,NULL),(322,2,'2026-05-10 10:25:39.002715','I completed my assigned tasks on time.',13,23,NULL,NULL),(323,2,'2026-05-10 10:25:39.050548','I contributed to team goals.',0,24,NULL,NULL),(324,2,'2026-05-10 10:25:39.050548','I was punctual and reliable.',1,24,NULL,NULL),(325,2,'2026-05-10 10:25:39.050548','I maintained a positive attitude.',2,24,NULL,NULL),(326,2,'2026-05-10 10:25:39.050548','I supported my team members.',3,24,NULL,NULL),(327,2,'2026-05-10 10:25:39.050548','I delivered work with minimal errors.',4,24,NULL,NULL),(328,2,'2026-05-10 10:25:39.050548','I managed my time effectively.',5,24,NULL,NULL),(329,2,'2026-05-10 10:25:39.050548','I am satisfied with my performance.',6,24,NULL,NULL),(330,2,'2026-05-10 10:25:39.050548','I met my goals this period.',7,24,NULL,NULL),(331,2,'2026-05-10 10:25:39.050548','I tried to learn or improve my skills.',8,24,NULL,NULL),(332,2,'2026-05-10 10:25:39.050548','I followed company rules and processes.',9,24,NULL,NULL),(333,2,'2026-05-10 10:25:39.050548','I collaborated well with others.',10,24,NULL,NULL),(334,2,'2026-05-10 10:25:39.050548','I communicated clearly with my team.',11,24,NULL,NULL),(335,2,'2026-05-10 10:25:39.050548','My work quality met expected standards.',12,24,NULL,NULL),(336,2,'2026-05-10 10:25:39.050548','I completed my assigned tasks on time.',13,24,NULL,NULL),(337,2,'2026-05-10 10:25:39.100684','I contributed to team goals.',0,25,NULL,NULL),(338,2,'2026-05-10 10:25:39.100684','I was punctual and reliable.',1,25,NULL,NULL),(339,2,'2026-05-10 10:25:39.100684','I maintained a positive attitude.',2,25,NULL,NULL),(340,2,'2026-05-10 10:25:39.100684','I supported my team members.',3,25,NULL,NULL),(341,2,'2026-05-10 10:25:39.100684','I delivered work with minimal errors.',4,25,NULL,NULL),(342,2,'2026-05-10 10:25:39.100684','I managed my time effectively.',5,25,NULL,NULL),(343,2,'2026-05-10 10:25:39.100684','I am satisfied with my performance.',6,25,NULL,NULL),(344,2,'2026-05-10 10:25:39.100684','I met my goals this period.',7,25,NULL,NULL),(345,2,'2026-05-10 10:25:39.100684','I tried to learn or improve my skills.',8,25,NULL,NULL),(346,2,'2026-05-10 10:25:39.100684','I followed company rules and processes.',9,25,NULL,NULL),(347,2,'2026-05-10 10:25:39.100684','I collaborated well with others.',10,25,NULL,NULL),(348,2,'2026-05-10 10:25:39.100684','I communicated clearly with my team.',11,25,NULL,NULL),(349,2,'2026-05-10 10:25:39.100684','My work quality met expected standards.',12,25,NULL,NULL),(350,2,'2026-05-10 10:25:39.100684','I completed my assigned tasks on time.',13,25,NULL,NULL),(351,2,'2026-05-10 10:25:39.155983','I contributed to team goals.',0,26,NULL,NULL),(352,2,'2026-05-10 10:25:39.155983','I was punctual and reliable.',1,26,NULL,NULL),(353,2,'2026-05-10 10:25:39.155983','I maintained a positive attitude.',2,26,NULL,NULL),(354,2,'2026-05-10 10:25:39.155983','I supported my team members.',3,26,NULL,NULL),(355,2,'2026-05-10 10:25:39.155983','I delivered work with minimal errors.',4,26,NULL,NULL),(356,2,'2026-05-10 10:25:39.155983','I managed my time effectively.',5,26,NULL,NULL),(357,2,'2026-05-10 10:25:39.155983','I am satisfied with my performance.',6,26,NULL,NULL),(358,2,'2026-05-10 10:25:39.155983','I met my goals this period.',7,26,NULL,NULL),(359,2,'2026-05-10 10:25:39.155983','I tried to learn or improve my skills.',8,26,NULL,NULL),(360,2,'2026-05-10 10:25:39.155983','I followed company rules and processes.',9,26,NULL,NULL),(361,2,'2026-05-10 10:25:39.155983','I collaborated well with others.',10,26,NULL,NULL),(362,2,'2026-05-10 10:25:39.155983','I communicated clearly with my team.',11,26,NULL,NULL),(363,2,'2026-05-10 10:25:39.155983','My work quality met expected standards.',12,26,NULL,NULL),(364,2,'2026-05-10 10:25:39.155983','I completed my assigned tasks on time.',13,26,NULL,NULL),(365,2,'2026-05-10 10:25:39.206086','I contributed to team goals.',0,27,NULL,NULL),(366,2,'2026-05-10 10:25:39.206086','I was punctual and reliable.',1,27,NULL,NULL),(367,2,'2026-05-10 10:25:39.206086','I maintained a positive attitude.',2,27,NULL,NULL),(368,2,'2026-05-10 10:25:39.206086','I supported my team members.',3,27,NULL,NULL),(369,2,'2026-05-10 10:25:39.206086','I delivered work with minimal errors.',4,27,NULL,NULL),(370,2,'2026-05-10 10:25:39.206086','I managed my time effectively.',5,27,NULL,NULL),(371,2,'2026-05-10 10:25:39.206086','I am satisfied with my performance.',6,27,NULL,NULL),(372,2,'2026-05-10 10:25:39.206086','I met my goals this period.',7,27,NULL,NULL),(373,2,'2026-05-10 10:25:39.206086','I tried to learn or improve my skills.',8,27,NULL,NULL),(374,2,'2026-05-10 10:25:39.206086','I followed company rules and processes.',9,27,NULL,NULL),(375,2,'2026-05-10 10:25:39.206086','I collaborated well with others.',10,27,NULL,NULL),(376,2,'2026-05-10 10:25:39.206086','I communicated clearly with my team.',11,27,NULL,NULL),(377,2,'2026-05-10 10:25:39.206086','My work quality met expected standards.',12,27,NULL,NULL),(378,2,'2026-05-10 10:25:39.206086','I completed my assigned tasks on time.',13,27,NULL,NULL),(379,2,'2026-05-10 10:25:39.264449','I contributed to team goals.',0,28,NULL,NULL),(380,2,'2026-05-10 10:25:39.264449','I was punctual and reliable.',1,28,NULL,NULL),(381,2,'2026-05-10 10:25:39.264449','I maintained a positive attitude.',2,28,NULL,NULL),(382,2,'2026-05-10 10:25:39.264449','I supported my team members.',3,28,NULL,NULL),(383,2,'2026-05-10 10:25:39.264449','I delivered work with minimal errors.',4,28,NULL,NULL),(384,2,'2026-05-10 10:25:39.264449','I managed my time effectively.',5,28,NULL,NULL),(385,2,'2026-05-10 10:25:39.264449','I am satisfied with my performance.',6,28,NULL,NULL),(386,2,'2026-05-10 10:25:39.264449','I met my goals this period.',7,28,NULL,NULL),(387,2,'2026-05-10 10:25:39.264449','I tried to learn or improve my skills.',8,28,NULL,NULL),(388,2,'2026-05-10 10:25:39.264449','I followed company rules and processes.',9,28,NULL,NULL),(389,2,'2026-05-10 10:25:39.264449','I collaborated well with others.',10,28,NULL,NULL),(390,2,'2026-05-10 10:25:39.264449','I communicated clearly with my team.',11,28,NULL,NULL),(391,2,'2026-05-10 10:25:39.264449','My work quality met expected standards.',12,28,NULL,NULL),(392,2,'2026-05-10 10:25:39.264449','I completed my assigned tasks on time.',13,28,NULL,NULL),(393,2,'2026-05-10 10:25:39.316696','I contributed to team goals.',0,29,NULL,NULL),(394,2,'2026-05-10 10:25:39.316696','I was punctual and reliable.',1,29,NULL,NULL),(395,2,'2026-05-10 10:25:39.316696','I maintained a positive attitude.',2,29,NULL,NULL),(396,2,'2026-05-10 10:25:39.316696','I supported my team members.',3,29,NULL,NULL),(397,2,'2026-05-10 10:25:39.316696','I delivered work with minimal errors.',4,29,NULL,NULL),(398,2,'2026-05-10 10:25:39.316696','I managed my time effectively.',5,29,NULL,NULL),(399,2,'2026-05-10 10:25:39.316696','I am satisfied with my performance.',6,29,NULL,NULL),(400,2,'2026-05-10 10:25:39.316696','I met my goals this period.',7,29,NULL,NULL),(401,2,'2026-05-10 10:25:39.316696','I tried to learn or improve my skills.',8,29,NULL,NULL),(402,2,'2026-05-10 10:25:39.316696','I followed company rules and processes.',9,29,NULL,NULL),(403,2,'2026-05-10 10:25:39.316696','I collaborated well with others.',10,29,NULL,NULL),(404,2,'2026-05-10 10:25:39.316696','I communicated clearly with my team.',11,29,NULL,NULL),(405,2,'2026-05-10 10:25:39.316696','My work quality met expected standards.',12,29,NULL,NULL),(406,2,'2026-05-10 10:25:39.316696','I completed my assigned tasks on time.',13,29,NULL,NULL),(407,2,'2026-05-10 10:25:39.371482','I contributed to team goals.',0,30,NULL,NULL),(408,2,'2026-05-10 10:25:39.371482','I was punctual and reliable.',1,30,NULL,NULL),(409,2,'2026-05-10 10:25:39.371482','I maintained a positive attitude.',2,30,NULL,NULL),(410,2,'2026-05-10 10:25:39.371482','I supported my team members.',3,30,NULL,NULL),(411,2,'2026-05-10 10:25:39.371482','I delivered work with minimal errors.',4,30,NULL,NULL),(412,2,'2026-05-10 10:25:39.371482','I managed my time effectively.',5,30,NULL,NULL),(413,2,'2026-05-10 10:25:39.371482','I am satisfied with my performance.',6,30,NULL,NULL),(414,2,'2026-05-10 10:25:39.371482','I met my goals this period.',7,30,NULL,NULL),(415,2,'2026-05-10 10:25:39.371482','I tried to learn or improve my skills.',8,30,NULL,NULL),(416,2,'2026-05-10 10:25:39.371482','I followed company rules and processes.',9,30,NULL,NULL),(417,2,'2026-05-10 10:25:39.371482','I collaborated well with others.',10,30,NULL,NULL),(418,2,'2026-05-10 10:25:39.371482','I communicated clearly with my team.',11,30,NULL,NULL),(419,2,'2026-05-10 10:25:39.371482','My work quality met expected standards.',12,30,NULL,NULL),(420,2,'2026-05-10 10:25:39.371482','I completed my assigned tasks on time.',13,30,NULL,NULL),(421,2,'2026-05-10 10:25:39.428321','I contributed to team goals.',0,31,NULL,NULL),(422,2,'2026-05-10 10:25:39.428321','I was punctual and reliable.',1,31,NULL,NULL),(423,2,'2026-05-10 10:25:39.428321','I maintained a positive attitude.',2,31,NULL,NULL),(424,2,'2026-05-10 10:25:39.428321','I supported my team members.',3,31,NULL,NULL),(425,2,'2026-05-10 10:25:39.428321','I delivered work with minimal errors.',4,31,NULL,NULL),(426,2,'2026-05-10 10:25:39.428321','I managed my time effectively.',5,31,NULL,NULL),(427,2,'2026-05-10 10:25:39.428321','I am satisfied with my performance.',6,31,NULL,NULL),(428,2,'2026-05-10 10:25:39.428321','I met my goals this period.',7,31,NULL,NULL),(429,2,'2026-05-10 10:25:39.428321','I tried to learn or improve my skills.',8,31,NULL,NULL),(430,2,'2026-05-10 10:25:39.428321','I followed company rules and processes.',9,31,NULL,NULL),(431,2,'2026-05-10 10:25:39.428321','I collaborated well with others.',10,31,NULL,NULL),(432,2,'2026-05-10 10:25:39.428321','I communicated clearly with my team.',11,31,NULL,NULL),(433,2,'2026-05-10 10:25:39.428321','My work quality met expected standards.',12,31,NULL,NULL),(434,2,'2026-05-10 10:25:39.428321','I completed my assigned tasks on time.',13,31,NULL,NULL);
/*!40000 ALTER TABLE `self_assessment_form_template_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_settings`
--

DROP TABLE IF EXISTS `self_assessment_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_settings` (
  `id` bigint NOT NULL,
  `rating_system` varchar(20) NOT NULL DEFAULT 'FIVE_POINT',
  `updated_by` bigint DEFAULT NULL,
  `updated_on` datetime(6) DEFAULT NULL,
  `ten_point_yes_min_rating` int NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_settings`
--

LOCK TABLES `self_assessment_settings` WRITE;
/*!40000 ALTER TABLE `self_assessment_settings` DISABLE KEYS */;
INSERT INTO `self_assessment_settings` VALUES (1,'FIVE_POINT',2,'2026-05-04 08:06:28.287582',5);
/*!40000 ALTER TABLE `self_assessment_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `signatures`
--

DROP TABLE IF EXISTS `signatures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `signatures` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_default` bit(1) DEFAULT NULL,
  `signature_data` longtext,
  `signature_type` varchar(255) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9f44y14sujnbi51nlc3mgh7cj` (`user_id`),
  CONSTRAINT `FK9f44y14sujnbi51nlc3mgh7cj` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `signatures`
--

LOCK TABLES `signatures` WRITE;
/*!40000 ALTER TABLE `signatures` DISABLE KEYS */;
INSERT INTO `signatures` VALUES (1,'2026-04-29 13:41:17.053803',_binary '\0','/uploads/signatures/6ecc50e8-c15d-4a64-aac6-8486e156fafa.webp','UPLOADED_IMAGE',2),(2,'2026-04-29 13:44:26.278702',_binary '\0','/uploads/signatures/750bb090-cfa9-4a6b-b33b-f06558885db1.png','DRAWN_PNG',2),(3,'2026-04-29 13:44:41.929146',_binary '\0','/uploads/signatures/ba617093-2f3c-4c0b-a18a-8edb94422255.png','DRAWN_PNG',2),(4,'2026-04-29 13:50:01.646869',_binary '\0','/uploads/signatures/ab16c5be-5941-4b77-94ba-e0d15aa1ebf5.webp','UPLOADED_IMAGE',2),(5,'2026-04-29 14:01:49.130966',_binary '\0','/uploads/signatures/46ad3ebe-81cd-487a-8c43-62c203c27546.png','DRAWN_PNG',2),(6,'2026-04-29 14:02:21.146128',_binary '\0','/uploads/signatures/08ede255-797a-4f78-bbd0-b9c631368f6b.png','DRAWN_PNG',2),(7,'2026-04-29 14:14:38.922083',_binary '\0','/uploads/signatures/1c461071-d394-414f-a007-5c5d7854fd0d.webp','UPLOADED_IMAGE',2),(8,'2026-04-29 14:16:45.522519',_binary '\0','/uploads/signatures/46fbef93-74c0-421e-88a5-28ce9c997547.png','DRAWN_PNG',2),(9,'2026-04-29 14:36:04.291823',_binary '','/uploads/signatures/71448cfb-389f-41bf-a788-c67b42f4b25d.png','DRAWN_PNG',2),(10,'2026-05-10 15:28:53.873836',_binary '','/uploads/signatures/ba2c218b-7d67-4d96-87b9-ccc81a914226.png','DRAWN_PNG',29),(11,'2026-05-11 12:51:42.625600',_binary '','/uploads/signatures/e9a264d3-c580-4760-afdd-cafd78b2c100.png','DRAWN_PNG',124),(12,'2026-05-13 10:40:04.457811',_binary '','/uploads/signatures/938f8a34-24c5-49bf-8528-e051489cd242.png','DRAWN_PNG',94),(13,'2026-05-13 13:26:58.885703',_binary '','/uploads/signatures/8732417c-10cf-4756-a01b-3a9edaf1f6dc.png','DRAWN_PNG',47),(14,'2026-05-16 08:44:57.348428',_binary '','/uploads/signatures/50cd6d99-79f3-4e1d-b471-4b1d824f243e.png','DRAWN_PNG',42),(15,'2026-05-16 14:57:33.064278',_binary '','/uploads/signatures/48c693eb-7924-4e69-9af1-18fd4ad7246d.png','DRAWN_PNG',5);
/*!40000 ALTER TABLE `signatures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_type`
--

DROP TABLE IF EXISTS `staff_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_type` (
  `id` bigint NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_type`
--

LOCK TABLES `staff_type` WRITE;
/*!40000 ALTER TABLE `staff_type` DISABLE KEYS */;
INSERT INTO `staff_type` VALUES (1,'Permanent'),(2,'Probation');
/*!40000 ALTER TABLE `staff_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `template_categories`
--

DROP TABLE IF EXISTS `template_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_categories` (
  `template_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  KEY `FKnumsa8eecxxhgh7e99hdboerb` (`category_id`),
  KEY `FK6ssyunq8f7cjaq1cx1g18d02u` (`template_id`),
  CONSTRAINT `FK6ssyunq8f7cjaq1cx1g18d02u` FOREIGN KEY (`template_id`) REFERENCES `appraisal_templates` (`id`),
  CONSTRAINT `FKnumsa8eecxxhgh7e99hdboerb` FOREIGN KEY (`category_id`) REFERENCES `appraisal_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `template_categories`
--

LOCK TABLES `template_categories` WRITE;
/*!40000 ALTER TABLE `template_categories` DISABLE KEYS */;
INSERT INTO `template_categories` VALUES (1,1),(1,2),(1,3),(1,4);
/*!40000 ALTER TABLE `template_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `template_department_positions`
--

DROP TABLE IF EXISTS `template_department_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_department_positions` (
  `template_id` bigint NOT NULL,
  `department_position_id` bigint NOT NULL,
  KEY `FK41xbf5rgw0edobl061w3bwb0f` (`department_position_id`),
  KEY `FKej5txuqbwmu122h6twtmcl2qr` (`template_id`),
  CONSTRAINT `FK41xbf5rgw0edobl061w3bwb0f` FOREIGN KEY (`department_position_id`) REFERENCES `department_position` (`id`),
  CONSTRAINT `FKej5txuqbwmu122h6twtmcl2qr` FOREIGN KEY (`template_id`) REFERENCES `appraisal_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `template_department_positions`
--

LOCK TABLES `template_department_positions` WRITE;
/*!40000 ALTER TABLE `template_department_positions` DISABLE KEYS */;
INSERT INTO `template_department_positions` VALUES (1,4);
/*!40000 ALTER TABLE `template_department_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time_settings`
--

DROP TABLE IF EXISTS `time_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `duration` varchar(255) NOT NULL,
  `end_date` date NOT NULL,
  `start_date` date NOT NULL,
  `year_type` varchar(255) NOT NULL,
  `pending_year_type` varchar(255) DEFAULT NULL,
  `period_type` enum('ANNUAL','BOTH','SEMI_ANNUAL') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_settings`
--

LOCK TABLES `time_settings` WRITE;
/*!40000 ALTER TABLE `time_settings` DISABLE KEYS */;
INSERT INTO `time_settings` VALUES (1,'6 Months','2026-09-30','2026-04-01','Budget Year',NULL,NULL);
/*!40000 ALTER TABLE `time_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_development_history`
--

DROP TABLE IF EXISTS `training_development_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_development_history` (
  `training_id` bigint NOT NULL AUTO_INCREMENT,
  `completion_status` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_date` date NOT NULL,
  `training_name` varchar(255) NOT NULL,
  `training_provider` varchar(255) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `pip_id` bigint DEFAULT NULL,
  `total_completed_hours` int DEFAULT NULL,
  `percentage_completion` int DEFAULT NULL,
  `feedback_notes` text,
  PRIMARY KEY (`training_id`),
  KEY `FK16ydg3tsfl0xs04u0y9ta4de8` (`employee_id`),
  KEY `FK7t84p9ewyfn76q3f5yigttlob` (`pip_id`),
  CONSTRAINT `FK16ydg3tsfl0xs04u0y9ta4de8` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FK7t84p9ewyfn76q3f5yigttlob` FOREIGN KEY (`pip_id`) REFERENCES `performance_improvement_plan` (`pip_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_development_history`
--

LOCK TABLES `training_development_history` WRITE;
/*!40000 ALTER TABLE `training_development_history` DISABLE KEYS */;
INSERT INTO `training_development_history` VALUES (1,'NOT_STARTED','2026-05-12 20:06:55.090855','2026-04-30','2026-04-27','Communication weak','John Smith','2026-05-13 09:03:41.071612',38,2,0,0,NULL),(2,'COMPLETED','2026-05-12 20:06:55.090855','2026-04-27','2026-04-28','Communication weak','John Smith','2026-05-13 09:03:41.071612',33,1,0,0,NULL),(3,'NOT_STARTED','2026-05-12 20:06:55.174320','2026-04-28','2026-04-27','aaa','John Smith','2026-05-13 09:03:41.088089',33,3,0,0,NULL),(4,'NOT_STARTED','2026-05-12 20:06:55.180636','2026-04-28','2026-04-27','bbb','John Smith','2026-05-13 09:03:41.096574',33,3,0,0,NULL),(5,'NOT_STARTED','2026-05-12 20:06:55.199074','2026-04-28','2026-04-27','ccc','John Smith','2026-05-13 09:03:41.104545',33,3,0,0,NULL),(6,'NOT_STARTED','2026-05-12 20:06:55.221031','2026-04-28','2026-04-27','ddd','John Smith','2026-05-13 09:03:41.111857',33,3,0,0,NULL),(7,'NOT_STARTED','2026-05-12 20:12:40.719694','2026-05-14','2026-05-13','Object1','Min Min Tun','2026-05-13 09:03:41.071612',124,4,0,0,NULL),(8,'NOT_STARTED','2026-05-12 20:12:40.725977','2026-05-14','2026-05-13','Objec2','Min Min Tun','2026-05-13 09:03:41.089482',124,4,0,0,NULL);
/*!40000 ALTER TABLE `training_development_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_account`
--

DROP TABLE IF EXISTS `user_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `is_active` bit(1) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `token_expiry` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `theme` varchar(20) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `timezone` varchar(50) DEFAULT NULL,
  `wallpaper_url` varchar(255) DEFAULT NULL,
  `time_format` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UK8sdf3db63yd6xx596kboaod8x` (`employee_id`),
  KEY `FK4j8uoaeve853dcbl0tjd0yoq0` (`role_id`),
  CONSTRAINT `FK4j8uoaeve853dcbl0tjd0yoq0` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`),
  CONSTRAINT `FKb8rqi2da12ugm0e92y14yrv4t` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$fdP8LGcm7M/uvDTZDiv4mujr2XcfkOEeQ7hZpKQy6OpzV.19NrOY2',NULL,NULL,1,1,0,NULL,NULL,NULL,NULL,NULL),(2,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$b7aF24VjZaTQMlE4io5Nw.EG93WK4uwSmNWaEwdhNEGnO5nwMRs6.',NULL,NULL,2,1,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(3,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$93eAfzqZLaUfxuwVsKd.AuqOWRR0UlFNMUFmEmg7TEMWm5x4BkaEG',NULL,NULL,3,2,0,NULL,NULL,NULL,NULL,NULL),(4,_binary '','2026-04-18 17:05:19.000000',NULL,'password123',NULL,NULL,4,4,0,NULL,NULL,NULL,NULL,NULL),(5,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$9iZJFtJJIdelLSQcf5CUL.MUgOR8fi1rLPwFncw3op2ObBYEWku6S',NULL,NULL,5,4,0,NULL,NULL,NULL,NULL,NULL),(6,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$zWvwwxIq/jAysbdNd5c3c.MacW7ojgHp4HBOHbQGkgYrjQKnUtWUW',NULL,NULL,6,4,0,NULL,NULL,NULL,NULL,NULL),(7,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$SOK542jo.l0/19qJ.gfAruUnKH4OXSblqbln56W89b/PAylZEm0nm',NULL,NULL,7,4,0,NULL,NULL,NULL,NULL,NULL),(8,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$qaXnuKyV5ZZphgf/aYzIUO14wRy.n/QnXzeKwZBSC6D1TyGfhEICC',NULL,NULL,8,4,0,NULL,NULL,NULL,NULL,NULL),(9,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$EgI7tfJfdXTjuaZGQ5D3BuQ9FvBGrPeMRKR6kiD.yS.wyXhLbtANe',NULL,NULL,9,4,0,NULL,NULL,NULL,NULL,NULL),(10,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$nau2UM/4e68PW1ZlmZxkJe5tQR17O7to8BJ/jQfEQ8TdTXpNG3lNu',NULL,NULL,10,4,0,NULL,NULL,NULL,NULL,NULL),(11,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$i.QbOEnWV5qyYMb6CoxJbOJDdI8BMMEOFlO2IbteJzQMChpziL3NO',NULL,NULL,11,4,0,NULL,NULL,NULL,NULL,NULL),(12,_binary '','2026-04-18 17:06:12.000000',NULL,'password123',NULL,NULL,12,1,0,NULL,NULL,NULL,NULL,NULL),(13,_binary '','2026-04-20 03:42:17.814880',NULL,'password123',NULL,NULL,13,2,0,NULL,NULL,NULL,NULL,NULL),(14,_binary '','2026-04-20 04:39:47.913237',NULL,'password123',NULL,NULL,14,2,0,NULL,NULL,NULL,NULL,NULL),(15,_binary '','2026-04-20 04:47:22.233432',NULL,'password123',NULL,NULL,15,2,1,NULL,NULL,NULL,NULL,NULL),(16,_binary '','2026-04-20 05:07:48.301493',NULL,'password123',NULL,NULL,16,2,0,NULL,NULL,NULL,NULL,NULL),(17,_binary '','2026-04-20 05:25:29.191919',NULL,'password123',NULL,NULL,17,2,0,NULL,NULL,NULL,NULL,NULL),(18,_binary '','2026-04-20 05:34:52.994466',NULL,'password123',NULL,NULL,18,2,0,NULL,NULL,NULL,NULL,NULL),(19,_binary '','2026-04-20 07:42:35.280025',NULL,'password123',NULL,NULL,19,2,0,NULL,NULL,NULL,NULL,NULL),(20,_binary '','2026-04-20 07:54:04.285681',NULL,'password123',NULL,NULL,20,2,0,NULL,NULL,NULL,NULL,NULL),(21,_binary '','2026-04-21 14:47:18.335487',NULL,'password123',NULL,NULL,21,2,0,NULL,NULL,NULL,NULL,NULL),(22,_binary '','2026-04-21 16:01:22.327025',NULL,'password123',NULL,NULL,22,2,0,NULL,NULL,NULL,NULL,NULL),(23,_binary '','2026-04-21 16:50:50.231215',NULL,'password123',NULL,NULL,23,2,0,NULL,NULL,NULL,NULL,NULL),(27,_binary '','2026-04-21 19:35:40.771218',NULL,'password123',NULL,NULL,27,2,1,NULL,NULL,NULL,NULL,NULL),(29,_binary '','2026-04-22 03:04:09.250089',NULL,'$2a$10$DPaBuaEPhX1HT/w955tZQO3k2/F3312PZUfucflHN./QKmZIYzE5q',NULL,NULL,29,2,0,NULL,NULL,NULL,NULL,NULL),(31,_binary '','2026-04-23 06:10:19.466063',NULL,'password123',NULL,NULL,32,2,1,NULL,NULL,NULL,NULL,NULL),(32,_binary '','2026-04-23 09:38:23.759936',NULL,'password123',NULL,NULL,33,2,1,NULL,NULL,NULL,NULL,NULL),(33,_binary '','2026-04-23 09:38:29.666373',NULL,'password123',NULL,NULL,34,2,1,NULL,NULL,NULL,NULL,NULL),(35,_binary '','2026-04-23 14:32:08.633324',NULL,'password123',NULL,NULL,36,2,1,NULL,NULL,NULL,NULL,NULL),(36,_binary '','2026-04-23 17:37:09.883428',NULL,'password123',NULL,NULL,37,2,0,NULL,NULL,NULL,NULL,NULL),(37,_binary '','2026-04-23 17:39:23.529867',NULL,'password123',NULL,NULL,38,2,0,NULL,NULL,NULL,NULL,NULL),(38,_binary '','2026-04-29 07:33:25.783171',NULL,'password123',NULL,NULL,39,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(39,_binary '','2026-05-01 17:53:23.659680',NULL,'password123',NULL,NULL,40,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(40,_binary '','2026-05-03 22:39:26.291196',NULL,'$2a$10$zgCuwg2AgNKihHRs2S7mDuzPQMsnIfIjn5M63M7DbfeRSntXC86.e',NULL,NULL,41,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(42,_binary '','2026-05-06 12:57:26.000000',NULL,'$2a$10$LT/RohNJokGFQOh0R2QpzuzwKVosmHcL9VOAYyheHyJZ6pmbAt9Ve',NULL,NULL,42,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(43,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,43,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(44,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,44,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(45,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,45,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(46,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,46,3,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(47,_binary '','2026-05-06 12:57:26.000000',NULL,'$2a$10$.0WiVfYTNmG.eLisC8exhubj1CMvAdyTzfWiRqDk1IzU8fQeQ.10.',NULL,NULL,47,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(48,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,48,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(49,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,49,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(50,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,50,3,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(51,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,51,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(52,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,52,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(53,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,53,3,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(54,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,54,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(55,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,55,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(56,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,56,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(57,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,57,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(58,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,58,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(59,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,59,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(60,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,60,3,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(61,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,61,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(62,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,62,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(63,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,63,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(64,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,64,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(65,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,65,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(66,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,66,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(67,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,67,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(68,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,68,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(69,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,69,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(70,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,70,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(71,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,71,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(72,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,72,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(73,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,73,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(74,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,74,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(75,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,75,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(76,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,76,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(77,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,77,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(78,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,78,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(79,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,79,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(80,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,80,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(81,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,81,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(82,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,82,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(83,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,83,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(84,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,84,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(85,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,85,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(86,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,86,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(87,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,87,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(88,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,88,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(89,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,89,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(90,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,90,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(91,_binary '','2026-05-06 12:57:26.000000',NULL,'password123',NULL,NULL,91,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(92,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,92,3,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(93,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,93,3,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(94,_binary '','2026-05-06 13:53:09.000000',NULL,'$2a$10$47EOI3Y.3p/A6GENq1i8WOy0lN9awctITu4mHqFwAqRMxOlrmICeu',NULL,NULL,94,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(95,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,95,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(96,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,96,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(97,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,97,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(98,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,98,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(99,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,99,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(100,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,100,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(101,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,101,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(102,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,102,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(103,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,103,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(104,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,104,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(105,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,105,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(106,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,106,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(107,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,107,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(108,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,108,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(109,_binary '','2026-05-06 13:53:09.000000',NULL,'$2a$10$MDWy/IhhViwaWVAjwpJfD.l5nJcHg.c1sI8lBFR674AGYANRXl8fm',NULL,NULL,109,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(110,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,110,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(111,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,111,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(112,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,112,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(113,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,113,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(114,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,114,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(115,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,115,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(116,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,116,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(117,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,117,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(118,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,118,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(119,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,119,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(120,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,120,4,1,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(121,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,121,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(122,_binary '','2026-05-06 13:53:09.000000',NULL,'password123',NULL,NULL,122,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(123,_binary '','2026-05-06 13:53:09.000000',NULL,'$2a$10$ASfvhYpkefVt0BbnJK0Q2Oq31cNlJALnqaLk2FfoFXI/BAzXHt6F2',NULL,NULL,123,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h'),(124,_binary '','2026-05-11 06:56:38.954755',NULL,'$2a$10$vGXDjOEmCJb.anJ2VU1nqOi8LSir7SFUYOs8SdtTqrLIOQ3b48BFa',NULL,NULL,124,4,0,'light','English','UTC+06:30 (Yangon)',NULL,'12h');
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-17 16:02:18
