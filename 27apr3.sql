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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_answers`
--

LOCK TABLES `appraisal_answers` WRITE;
/*!40000 ALTER TABLE `appraisal_answers` DISABLE KEYS */;
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
  `status` enum('DRAFT','HR_APPROVED','LOCKED','REJECTED','RETURNED','SUBMITTED') NOT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `total_score` double DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `period_id` bigint DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgqrsy0eet8yn2617lv1j33hsp` (`employee_id`),
  KEY `FK6s4w0ryspgw7q27yiy8q6p4wl` (`period_id`),
  CONSTRAINT `FK6s4w0ryspgw7q27yiy8q6p4wl` FOREIGN KEY (`period_id`) REFERENCES `appraisal_cycle` (`cycle_id`),
  CONSTRAINT `FKgqrsy0eet8yn2617lv1j33hsp` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_assignments`
--

LOCK TABLES `appraisal_assignments` WRITE;
/*!40000 ALTER TABLE `appraisal_assignments` DISABLE KEYS */;
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
INSERT INTO `appraisal_categories` VALUES (1,'Job Knowledge/Technical Skills','Evaluation of job knowledge and technical competence.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL),(2,'Accountability','Evaluation of commitment, initiative, and responsibility at work.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL),(3,'Problem Solving & Supervision','Evaluation of problem solving ability and supervision effectiveness.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL),(4,'Innovative','Evaluation of originality, creativity, and innovation.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL),(5,'Team Work','Evaluation of teamwork, collaboration, and information sharing.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL),(6,'Quality Work','Evaluation of work quality, standards, and process improvement.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL),(7,'Loyalty','Evaluation of trustworthiness, responsibility, and willingness to take responsibility.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL),(8,'Attendance/Rule and Regulations/Compliance','Evaluation of attendance, rules, regulations, and compliance.',_binary '','2026-04-20 06:56:18','2026-04-20 06:56:18',NULL,NULL);
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appraisal_templates`
--

LOCK TABLES `appraisal_templates` WRITE;
/*!40000 ALTER TABLE `appraisal_templates` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 03:42:17.825238','HR user 2 created employee account for employee_id 13 with role_id 4','{\"employeeId\": 13, \"userAccountId\": 13}',NULL,NULL,1,2,13,'EMPLOYEE'),(2,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 03:56:37.658280','Employee user_account_id 13 completed first-login password change',NULL,NULL,NULL,4,13,13,'USER_ACCOUNT'),(3,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 04:39:47.923768','HR user 2 created employee account for employee_id 14 with role_id 4','{\"employeeId\": 14, \"userAccountId\": 14}',NULL,NULL,1,2,14,'EMPLOYEE'),(4,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 04:40:39.999341','Employee user_account_id 14 completed first-login password change',NULL,NULL,NULL,4,14,14,'USER_ACCOUNT'),(5,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 04:47:22.240913','HR user 2 created employee account for employee_id 15 with role_id 4','{\"employeeId\": 15, \"userAccountId\": 15}',NULL,NULL,1,2,15,'EMPLOYEE'),(6,'TEMP_PASSWORD_RESENT','2026-04-20 04:47:35.017456','HR user 2 resent temporary password for user_account_id 15',NULL,NULL,NULL,1,2,15,'USER_ACCOUNT'),(7,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 05:07:48.306199','HR user 2 created employee account for employee_id 16 with role_id 4','{\"employeeId\": 16, \"userAccountId\": 16}',NULL,NULL,1,2,16,'EMPLOYEE'),(8,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 05:11:17.824186','Employee user_account_id 16 completed first-login password change',NULL,NULL,NULL,4,16,16,'USER_ACCOUNT'),(9,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 05:25:29.199513','HR user 2 created employee account for employee_id 17 with role_id 4','{\"employeeId\": 17, \"userAccountId\": 17}',NULL,NULL,1,2,17,'EMPLOYEE'),(10,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 05:26:08.560741','Employee user_account_id 17 completed first-login password change',NULL,NULL,NULL,4,17,17,'USER_ACCOUNT'),(11,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 05:34:52.999906','HR user 2 created employee account for employee_id 18 with role_id 4','{\"employeeId\": 18, \"userAccountId\": 18}',NULL,NULL,1,2,18,'EMPLOYEE'),(12,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 05:35:27.583836','Employee user_account_id 18 completed first-login password change',NULL,NULL,NULL,4,18,18,'USER_ACCOUNT'),(13,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 07:42:35.287155','HR user 2 created employee account for employee_id 19 with role_id 4','{\"employeeId\": 19, \"userAccountId\": 19}',NULL,NULL,1,2,19,'EMPLOYEE'),(14,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 07:43:23.986470','Employee user_account_id 19 completed first-login password change',NULL,NULL,NULL,4,19,19,'USER_ACCOUNT'),(15,'EMPLOYEE_ACCOUNT_CREATED','2026-04-20 07:54:04.285681','HR user 2 created employee account for employee_id 20 with role_id 4','{\"employeeId\": 20, \"userAccountId\": 20}',NULL,NULL,1,2,20,'EMPLOYEE'),(16,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-20 07:54:45.252219','Employee user_account_id 20 completed first-login password change',NULL,NULL,NULL,4,20,20,'USER_ACCOUNT'),(17,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 14:47:18.341903','HR user 2 created employee account for employee_id 21 with role_id 4','{\"employeeId\": 21, \"userAccountId\": 21}',NULL,NULL,1,2,21,'EMPLOYEE'),(18,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-21 14:49:48.970098','Employee user_account_id 21 completed first-login password change',NULL,NULL,NULL,4,21,21,'USER_ACCOUNT'),(19,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 16:01:22.335108','HR user 2 created employee account for employee_id 22 with role_id 4','{\"employeeId\": 22, \"userAccountId\": 22}',NULL,NULL,1,2,22,'EMPLOYEE'),(20,'TEMP_PASSWORD_RESENT','2026-04-21 16:02:38.277222','HR user resent temporary password for user_account_id 22',NULL,NULL,NULL,1,2,22,'USER_ACCOUNT'),(21,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-21 16:04:15.064929','Employee user_account_id 22 completed first-login password change',NULL,NULL,NULL,4,22,22,'USER_ACCOUNT'),(22,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 16:50:50.235829','HR user 2 created employee account for employee_id 23 with role_id 4','{\"employeeId\": 23, \"userAccountId\": 23}',NULL,NULL,1,2,23,'EMPLOYEE'),(26,'EMPLOYEE_ACCOUNT_CREATED','2026-04-21 19:35:40.774263','HR user 2 created employee account for employee_id 27 with role_id 4','{\"employeeId\": 27, \"userAccountId\": 27}',NULL,NULL,1,2,27,'EMPLOYEE'),(27,'EDIT_EMPLOYEE_INFO','2026-04-21 21:02:32.523826','HR user updated employee info for employee_id 19',NULL,NULL,NULL,1,2,19,'EMPLOYEE'),(29,'EMPLOYEE_ACCOUNT_CREATED','2026-04-22 03:04:09.254063','HR user 2 created employee account for employee_id 29 with role_id 4','{\"employeeId\": 29, \"userAccountId\": 29}',NULL,NULL,1,2,29,'EMPLOYEE'),(30,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-22 03:05:23.256035','Employee user_account_id 29 completed first-login password change',NULL,NULL,NULL,4,29,29,'USER_ACCOUNT'),(33,'EMPLOYEE_INITIAL_MOVEMENT','2026-04-23 06:10:19.247321','Initial movement history created for employee_id 32','{\"toPositionId\": 3, \"toDepartmentId\": 2, \"movementHistoryId\": 2}',NULL,NULL,1,2,32,'EMPLOYEE'),(34,'EMPLOYEE_ACCOUNT_CREATED','2026-04-23 06:10:19.473009','HR user 2 created employee account for employee_id 32 with role_id 3','{\"employeeId\": 32, \"userAccountId\": 31}',NULL,NULL,1,2,32,'EMPLOYEE'),(35,'EMPLOYEE_BULK_IMPORT','2026-04-23 09:38:33.807785','HR user 2 committed import session b1290871-1333-4977-b699-2aea1b9932c8: 2 imported, 0 failed','{\"fileName\": \"employee_import_template (22).xlsx\", \"failedCount\": 0, \"validationId\": \"b1290871-1333-4977-b699-2aea1b9932c8\", \"importedCount\": 2}',NULL,NULL,1,2,3,'EMPLOYEE'),(36,'EMPLOYEE_INITIAL_MOVEMENT','2026-04-23 14:32:08.495885','Initial movement history created for employee_id 36','{\"toPositionId\": 4, \"toDepartmentId\": 2, \"movementHistoryId\": 3}',NULL,NULL,1,2,36,'EMPLOYEE'),(37,'EMPLOYEE_ACCOUNT_CREATED','2026-04-23 14:32:08.637831','HR user 2 created employee account for employee_id 36 with role_id 4','{\"employeeId\": 36, \"userAccountId\": 35}',NULL,NULL,1,2,36,'EMPLOYEE'),(38,'EMPLOYEE_INITIAL_MOVEMENT','2026-04-23 17:37:09.746787','Initial movement history created for employee_id 37','{\"toPositionId\": 3, \"toDepartmentId\": 2, \"movementHistoryId\": 4}',NULL,NULL,1,2,37,'EMPLOYEE'),(39,'EMPLOYEE_ACCOUNT_CREATED','2026-04-23 17:37:09.893228','HR user 2 created employee account for employee_id 37 with role_id 3','{\"employeeId\": 37, \"userAccountId\": 36}',NULL,NULL,1,2,37,'EMPLOYEE'),(40,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-23 17:37:39.702214','Employee user_account_id 36 completed first-login password change',NULL,NULL,NULL,3,36,36,'USER_ACCOUNT'),(41,'EMPLOYEE_BULK_IMPORT','2026-04-23 17:39:27.694850','HR user 2 committed import session cea6bd29-1640-4ff6-8131-b9e5553737ea: 1 imported, 0 failed','{\"fileName\": \"employee_import_template (23).xlsx\", \"failedCount\": 0, \"validationId\": \"cea6bd29-1640-4ff6-8131-b9e5553737ea\", \"importedCount\": 1}',NULL,NULL,1,2,6,'EMPLOYEE'),(42,'EMPLOYMENT_STATUS_UPDATED','2026-04-25 11:24:26.838419','HR updated employment status to RESIGNED for employee_id 38',NULL,NULL,NULL,1,2,38,'EMPLOYEE'),(43,'PASSWORD_CHANGED_FIRST_LOGIN','2026-04-25 11:25:37.599885','Employee user_account_id 37 completed first-login password change',NULL,NULL,NULL,4,37,37,'USER_ACCOUNT');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
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
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `UKtc0vggvvuqc22trtdy0dmrahh` (`department_code`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department`
--

LOCK TABLES `department` WRITE;
/*!40000 ALTER TABLE `department` DISABLE KEYS */;
INSERT INTO `department` VALUES (1,'HR','2026-04-18 17:04:30.000000','Human Resources','Active','2026-04-23 17:29:49.423174'),(2,'ENG','2026-04-18 17:04:30.000000','Engineering','Active',NULL),(3,'FIN','2026-04-18 17:04:30.000000','Finance','Active',NULL),(4,'OPS','2026-04-18 17:04:30.000000','Operations','Active',NULL),(5,'MKT','2026-04-22 14:00:00.000000','Marketing','Active',NULL),(6,'SLS','2026-04-22 14:00:00.000000','Sales','Active',NULL),(7,'IT','2026-04-22 14:00:00.000000','Information Technology','Active',NULL),(8,'LGL','2026-04-22 14:00:00.000000','Legal','Active','2026-04-23 17:28:10.070364'),(9,'CS','2026-04-22 14:00:00.000000','Customer Service','Active',NULL),(10,'RND','2026-04-22 14:00:00.000000','Research & Development','Active',NULL),(11,'PRC','2026-04-22 14:00:00.000000','Procurement','Active',NULL),(12,'QA','2026-04-22 14:00:00.000000','Quality Assurance','Active',NULL),(13,'ADM','2026-04-22 14:00:00.000000','Administration','Active',NULL),(14,'SEC','2026-04-22 14:00:00.000000','Security','Active',NULL);
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergency_contact`
--

LOCK TABLES `emergency_contact` WRITE;
/*!40000 ALTER TABLE `emergency_contact` DISABLE KEYS */;
INSERT INTO `emergency_contact` VALUES (1,'095894165845','Father',14),(2,'0952658485','Mother',15),(3,'09512651420','Mother',16),(4,'0941548512','Father',17),(5,'09512525415','Mother',18),(6,'0951258412','Father',NULL),(7,'095265431535','Father',NULL),(8,'0951284712','Wife',NULL),(9,'0951564578','Father',NULL),(10,'0985466516','Parent',NULL),(14,'0914851656','Spouse',NULL),(16,'0915474562','Father',NULL),(19,'0958415841','Mother',NULL),(20,'095087532','Father',NULL),(21,'095186583','Uncle',NULL),(23,'09512525415','Spouse',NULL),(24,'0951258412','Father',NULL),(25,'095087532','Father',NULL);
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
  `manager_id` bigint DEFAULT NULL,
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
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `UKedv9qdyvr6t5pe4ppmcyyloy` (`staff_no`),
  UNIQUE KEY `UK73l40lhrvbc5lltmb7etk2v3q` (`father_id`),
  KEY `FKbejtwvg9bxus2mffsm3swj3u9` (`department_id`),
  KEY `FKou6wbxug1d0qf9mabut3xqblo` (`manager_id`),
  KEY `FKbc8rdko9o9n1ri9bpdyxv3x7i` (`position_id`),
  KEY `FK2gtsdm47oitcqestiq95kan0f` (`staff_type_id`),
  KEY `fk_emergency_contact_idx` (`emergency_contact_id`),
  KEY `fk_employee_department_position` (`department_position_id`),
  CONSTRAINT `FK2gtsdm47oitcqestiq95kan0f` FOREIGN KEY (`staff_type_id`) REFERENCES `staff_type` (`id`),
  CONSTRAINT `fk_emergency_contact` FOREIGN KEY (`emergency_contact_id`) REFERENCES `emergency_contact` (`id`),
  CONSTRAINT `fk_employee_department_position` FOREIGN KEY (`department_position_id`) REFERENCES `department_position` (`id`),
  CONSTRAINT `FKbc8rdko9o9n1ri9bpdyxv3x7i` FOREIGN KEY (`position_id`) REFERENCES `position` (`position_id`),
  CONSTRAINT `FKbejtwvg9bxus2mffsm3swj3u9` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`),
  CONSTRAINT `FKg3u5qt3skmqmplbuqdoi3jx9k` FOREIGN KEY (`father_id`) REFERENCES `father` (`id`),
  CONSTRAINT `FKou6wbxug1d0qf9mabut3xqblo` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,'2026-04-18 17:04:59.000000','2024-01-01','admin@gmail.com','1','HR Admin','Female',NULL,'Buddhist','12/ABN(123)456','2026-04-25 17:11:25.000000',1,NULL,NULL,1,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',1),(2,'2026-04-18 17:04:59.000000','2024-01-01','hr@gmail.com','2','Myat noe aung','Male','/api/public/profile-pictures/203d4cbe-b6fa-4b90-8ec4-d03b2930895a.jpg','Buddhist','13/CMN(456)789','2026-04-25 17:11:25.000000',1,NULL,NULL,1,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',1),(3,'2026-04-18 17:04:59.000000','2023-06-15','john.smith@epms.com','3','John Smith','Male',NULL,'Christian','14/DEF(789)012','2026-04-25 17:11:25.000000',2,NULL,NULL,3,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',3),(4,'2026-04-18 17:04:59.000000','2023-08-20','sarah.j@epms.com','4','Sarah Johnson','Female',NULL,'Christian','15/GHI(345)678','2026-04-25 17:11:25.000000',2,NULL,NULL,3,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',3),(5,'2026-04-18 17:04:59.000000','2024-01-10','mike.chen@epms.com','5','Mike Chen','Male',NULL,'Buddhist','16/JKL(901)234','2026-04-25 17:11:25.000000',2,NULL,3,4,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',4),(6,'2026-04-18 17:04:59.000000','2024-02-15','lisa.wong@epms.com','6','Lisa Wong','Female',NULL,'Buddhist','17/MNO(567)890','2026-04-25 17:11:25.000000',2,NULL,3,4,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',4),(7,'2026-04-18 17:04:59.000000','2024-03-01','david.kim@epms.com','7','David Kim','Male',NULL,'Christian','18/PQR(123)456','2026-04-25 17:11:25.000000',2,NULL,3,4,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',4),(8,'2026-04-18 17:04:59.000000','2023-05-10','alice.brown@epms.com','8','Alice Brown','Female',NULL,'Muslim','19/STU(789)012','2026-04-25 17:11:25.000000',3,NULL,NULL,6,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',6),(9,'2026-04-18 17:04:59.000000','2024-01-20','bob.wilson@epms.com','9','Bob Wilson','Male',NULL,'Buddhist','20/VWX(345)678','2026-04-25 17:11:25.000000',3,NULL,8,5,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',7),(10,'2026-04-18 17:04:59.000000','2023-07-01','carol.davis@epms.com','10','Carol Davis','Female',NULL,'Hindu','21/YZA(901)234','2026-04-25 17:11:25.000000',4,NULL,NULL,7,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',8),(11,'2026-04-18 17:04:59.000000','2022-01-01','ceo@epms.com','11','Robert CEO','Male',NULL,'Christian','22/BCD(567)890',NULL,NULL,NULL,NULL,8,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),(12,'2026-04-18 17:06:09.000000',NULL,'admin@epms.com','12','System Admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ACTIVE',NULL),(13,'2026-04-20 03:42:17.629122','2026-04-20','tylertyrell6@gmail.com','13','Tyler Tyrell','Male',NULL,'Buddhist','7/KaKaNa(N)165103','2026-04-25 17:11:25.000000',2,NULL,3,4,1,'095035786','Yangon, Myanmar','1999-03-20','Myanmar',2,2,NULL,'ACTIVE',4),(14,'2026-04-20 04:39:47.712633','2026-04-20','tyrelltyler6@gmail.com','14','Ko Pyae','Male',NULL,'Buddhist','5/MaKaNa(E)457545','2026-04-25 17:11:25.000000',3,1,NULL,6,1,'+959516584705','Tamwe, Yangon, Myanmar','1994-04-09','Myanmar',2,2,1,'ACTIVE',6),(15,'2026-04-20 04:47:22.105860','2026-04-20','do7year2024@gmail.com','15','Ko Aung','Male',NULL,'Buddhist','12/DaPaNa(N)156896','2026-04-25 17:11:25.000000',3,2,8,5,1,'0950561876','Bagan, Myanmar','2002-11-20','Myanmar',2,2,2,'ACTIVE',7),(16,'2026-04-20 05:07:47.917040','2026-04-20','sharebotz@sharebot.net','16','Khant Ko Ko','Male',NULL,'Buddhist','10/YaMaNa(N)154812','2026-04-25 17:11:25.000000',2,3,3,4,1,'09625486535','Myingyan, Myanmar','2000-01-02','Myanmar',2,2,3,'ACTIVE',4),(17,'2026-04-20 05:25:29.021176','2026-04-20','bamboohr@sharebot.net','17','Win Aung Aung','Male',NULL,'Buddhist','10/LaMaNa(N)541456','2026-04-25 17:11:25.000000',2,4,3,4,1,'095456855213','Myanmar','1990-04-10','Myanmar',2,2,4,'ACTIVE',4),(18,'2026-04-20 05:34:52.780643','2026-04-20','rusni@rustyload.com','18','Rus Ni','Female','/api/public/profile-pictures/96a3d0f7-be85-44e8-9f47-e81f322e03ca.png','Buddhist','11/YaThaTa(N)158451','2026-04-25 17:11:25.000000',3,5,8,5,1,'09154741235','Myanmar','2004-04-23','Myanmar',2,2,5,'ACTIVE',7),(19,'2026-04-20 07:42:35.059743','2026-04-20','34implicit@rustyload.com','19','Nyein Maung','Male','/api/public/profile-pictures/dbc05276-960b-4747-abc6-69d806bf56bc.jpg','Buddhist','9/AhMaZa(N)845165','2026-04-25 17:11:25.000000',2,6,3,4,2,'0945163145','Myanmar, Yangon','1980-07-08','Myanmar',2,2,6,'ACTIVE',4),(20,'2026-04-20 07:54:04.169926','2026-04-20','deltas@deltajohnsons.com','20','Kyaw Min','Male',NULL,'Christian','10/YaMaNa(N)453585','2026-04-25 17:11:25.000000',3,7,8,5,1,'09414651325','Yangon, Myanmar','1997-05-01','Myanmar',2,2,7,'ACTIVE',7),(21,'2026-04-21 14:47:18.136809','2026-04-21','deltasi@deltajohnsons.com','21','Aye Chan','Female','/api/public/profile-pictures/05499ae3-e041-449c-88aa-c6f62826dd9c.png','Christian','12/MaGaDa(N)156123','2026-04-25 17:11:25.000000',2,8,3,4,2,'099154154744','Yangon, Myanmar','1987-10-23','Myanmar',2,2,8,'ACTIVE',4),(22,'2026-04-21 16:01:21.945933','2026-04-21','abcdef1@deltajohnsons.com','22','Phyo Aung','Male',NULL,'Buddhist','11/KaTaLa(N)515984','2026-04-25 17:11:25.000000',3,9,8,5,1,'09525841254','No 111, Tamwe Tsp, Yangon','1999-11-10','Myanmar',2,2,9,'ACTIVE',7),(23,'2026-04-21 16:50:50.022912','2026-04-21','phyomin@deltajohnsons.com','23','Phyo Min','Male',NULL,'Buddhist','11/ThaTaNa(N)126521','2026-04-25 17:11:25.000000',2,10,3,4,2,'094584156','No 123, Yangon','1990-01-05','Myanmar',2,2,10,'ACTIVE',4),(27,'2026-04-21 19:35:40.614066','2026-04-22','livelytonia@fthcapital.com','24','Tun Tun','Male',NULL,'Buddhist','10/LaMaNa(N)489526','2026-04-25 17:11:25.000000',3,14,8,5,1,'09526845585','No 123 Myanmar','2001-07-08','Myanmar',2,2,14,'ACTIVE',7),(29,'2026-04-22 03:04:09.071084','2026-04-22','violetbobette@deltajohnsons.com','25','Min Min Tun','Male',NULL,'Buddhist','11/YaBaNa(N)815245','2026-04-25 17:11:25.000000',2,16,3,4,2,'095841265488','No 123, Bahan Tsp, Yangon','2001-08-01','Myanmar',2,2,16,'ACTIVE',4),(32,'2026-04-23 06:10:19.116175','2026-04-23','delaz@deltajohnsons.com','26','Mo Mo','Female',NULL,'Buddhist','12/HtaTaPa(N)123685','2026-04-25 17:11:25.000000',2,19,NULL,3,1,'0945125412','Street 123','1999-01-01','Myanmar',2,2,19,'ACTIVE',3),(33,'2026-04-23 09:38:23.527976','2026-04-23','test1one@deltajohnsons.com','27','Aung Kaung Myat','Male',NULL,'Buddhist','7/NYALAPA(N)012390','2026-04-25 17:11:25.000000',2,20,3,4,2,'095057863','No 123 Boston','1990-09-15','Myanmar',2,2,20,'ACTIVE',4),(34,'2026-04-23 09:38:29.491082','2026-04-23','testtwo@deltajohnsons.com','28','Ma Ma','Female',NULL,'Buddhist','7/NYALAPA(N)232390','2026-04-25 17:11:25.000000',2,21,NULL,3,1,'095057868','No 1222 Houston','2002-03-20','Myanmar',2,2,21,'ACTIVE',3),(36,'2026-04-23 14:32:08.437386','2026-04-23','kakakas@deltajohnsons.com','29','Hnin Hnin','Female','/api/public/profile-pictures/b1959b5e-7ce6-4941-98f0-b5c621c8b6fb.png','Buddhist','12/KaMaYa(N)025690','2026-04-23 14:32:08.437386',2,23,3,4,2,'095019327','Street 123 Database','2002-07-03','Myanmar',2,2,23,'ACTIVE',4),(37,'2026-04-23 17:37:09.688763','2026-04-24','hninmin@deltajohnsons.com','30','Hnin Min','Female','/api/public/profile-pictures/5bee4b8e-8ae6-4d58-a403-6850174dcc09.png','Hindu','14/NgaThaKha(N)201548','2026-04-23 17:37:09.688763',2,24,NULL,3,1,'09112232424','Yangon','2000-02-02','Myanmar',2,2,24,'ACTIVE',3),(38,'2026-04-23 17:39:23.319254','2026-04-23','vdeltas@deltajohnsons.com','31','Aung Ko Ko','Male',NULL,'Buddhist','7/NYALAPA(N)112390','2026-04-25 11:24:26.833890',2,25,3,4,2,'095057863','No 123 Boston','1990-09-15','Myanmar',2,2,25,'ACTIVE',4);
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_department_history`
--

LOCK TABLES `employee_department_history` WRITE;
/*!40000 ALTER TABLE `employee_department_history` DISABLE KEYS */;
INSERT INTO `employee_department_history` VALUES (2,2,'2026-04-23 06:10:19.232771',_binary '',NULL,'2026-04-23','INITIAL',NULL,NULL,NULL,NULL,32,NULL,NULL,2,3),(3,2,'2026-04-23 14:32:08.486797',_binary '',NULL,'2026-04-23','INITIAL',NULL,NULL,NULL,NULL,36,NULL,NULL,2,4),(4,2,'2026-04-23 17:37:09.744371',_binary '',NULL,'2026-04-24','INITIAL',NULL,NULL,NULL,NULL,37,NULL,NULL,2,3);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_probation`
--

LOCK TABLES `employee_probation` WRITE;
/*!40000 ALTER TABLE `employee_probation` DISABLE KEYS */;
INSERT INTO `employee_probation` VALUES (1,'2026-04-23','2026-07-23',19,90,NULL,NULL,NULL,NULL),(2,'2026-04-21','2026-07-21',21,90,NULL,NULL,NULL,NULL),(3,'2026-04-22','2026-07-22',29,90,NULL,NULL,NULL,NULL),(4,'2026-04-23','2026-04-22',33,NULL,NULL,NULL,NULL,NULL),(6,'2026-04-23','2026-07-22',36,90,2,'2026-04-23 14:32:08.437386',NULL,NULL),(7,'2026-04-23','2026-04-25',38,NULL,NULL,NULL,2,'2026-04-25 11:24:26.833890');
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
  `id` bigint NOT NULL AUTO_INCREMENT,
  `spouse_name` varchar(100) DEFAULT NULL,
  `spouse_nrc_no` varchar(100) DEFAULT NULL,
  `spouse_occupation` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_spouse`
--

LOCK TABLES `employee_spouse` WRITE;
/*!40000 ALTER TABLE `employee_spouse` DISABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `FKhw5c1n8n33omot2evjjgkotro` (`employee_id`),
  CONSTRAINT `FKhw5c1n8n33omot2evjjgkotro` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employeekpis`
--

LOCK TABLES `employeekpis` WRITE;
/*!40000 ALTER TABLE `employeekpis` DISABLE KEYS */;
/*!40000 ALTER TABLE `employeekpis` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `father`
--

LOCK TABLES `father` WRITE;
/*!40000 ALTER TABLE `father` DISABLE KEYS */;
INSERT INTO `father` VALUES (1,'U Kyaw','12/LaKaNa(N)451320','Businessman'),(2,'U Hla','11/PaNaKa(N)015485','Engineer'),(3,'U Aung','9/KaPaTa(N)265984','Doctor'),(4,'U Ba','8/MaMaNa(N)485126','Engineer'),(5,'U Ohn','10/ThaHtaNa(N)021548','Doctor'),(6,'U Maung','12/LaMaNa(N)154812','Doctor'),(7,'U Aye','10/KaKhaMa(N)596232','Engineer'),(8,'U Khine','12/KaTaNa(N)258526','Father'),(9,'U Min','11/GaMaNa(N)651545','Businessman'),(10,'U Mya','12/DaGaTa(N)484625','Chef'),(14,'U Mya Aung','12/LaThaYa(N)021548','Cooker'),(16,'U Aung Aung','12/LaMaNa(N)424645','Doctor'),(19,'U Yaw','12/DaGaTa(N)215485','Teacher'),(20,'U Hla','7/NYALAPA(E)321123','Worker'),(21,'U Ko Ko Oo','7/NYALAPA(N)320149','Teacher'),(23,'U Ba','10/YaMaNa(N)512026','Worker'),(24,'U Po Po','12/LaThaYa(N)021541','Father'),(25,'U Hla','7/NYALAPA(E)321123','Worker');
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
  PRIMARY KEY (`feedback_id`),
  KEY `FKo6yjtfhlhj147hc8xglmr4c6y` (`evaluatee_id`),
  KEY `FKgrp2eg0960uclxjgd5dm1u6hw` (`evaluator_id`),
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
  PRIMARY KEY (`id`),
  KEY `FKemk6u9hjlr9y7xj43axp8q6go` (`user_id`),
  CONSTRAINT `FKemk6u9hjlr9y7xj43axp8q6go` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
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
  `cycle_id` bigint DEFAULT NULL,
  `reopened_by` bigint DEFAULT NULL,
  `completed_hours` int DEFAULT NULL,
  `total_hours` int DEFAULT NULL,
  `final_outcome` varchar(50) DEFAULT NULL,
  `review_reason` text,
  PRIMARY KEY (`pip_id`),
  KEY `FKnsrfxycx0poo4n31k5nqvxsyk` (`closed_by`),
  KEY `FKtfecr6ype7r5ie8gx5a1trs49` (`created_by`),
  KEY `FKnsxoqt89frmt55fo62hr12bv7` (`employee_id`),
  KEY `FK7u8ptbdqg3amuf4n3wu4tm1lq` (`manager_id`),
  KEY `FK9vrdogjmsfbsyjc8gvte9dhli` (`cycle_id`),
  KEY `FKnhylt11x5ghcq98x5npjpx8pr` (`reopened_by`),
  CONSTRAINT `FK7u8ptbdqg3amuf4n3wu4tm1lq` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FK9vrdogjmsfbsyjc8gvte9dhli` FOREIGN KEY (`cycle_id`) REFERENCES `appraisal_cycle` (`cycle_id`),
  CONSTRAINT `FKnhylt11x5ghcq98x5npjpx8pr` FOREIGN KEY (`reopened_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKnsrfxycx0poo4n31k5nqvxsyk` FOREIGN KEY (`closed_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKnsxoqt89frmt55fo62hr12bv7` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FKtfecr6ype7r5ie8gx5a1trs49` FOREIGN KEY (`created_by`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `performance_improvement_plan`
--

LOCK TABLES `performance_improvement_plan` WRITE;
/*!40000 ALTER TABLE `performance_improvement_plan` DISABLE KEYS */;
INSERT INTO `performance_improvement_plan` VALUES (1,'2026-04-27','2026-04-27 05:13:53.139533','zzs','2026-04-27 04:54:56.892831','2026-04-30',0.00,NULL,NULL,'2026-04-28','CLOSED','2026-04-27 05:13:53.139533',2,3,33,3,NULL,NULL,0,4,'SUCCESSFUL',NULL),(2,NULL,NULL,NULL,'2026-04-27 05:03:51.970674','2026-04-30',0.00,NULL,NULL,'2026-04-27','ACTIVE','2026-04-27 05:12:47.400726',NULL,3,38,3,NULL,NULL,0,2,NULL,NULL),(3,NULL,NULL,NULL,'2026-04-27 05:18:37.675663','2026-04-28',0.00,NULL,NULL,'2026-04-27','ACTIVE','2026-04-27 05:19:05.208624',NULL,3,33,3,NULL,NULL,0,2,NULL,NULL);
/*!40000 ALTER TABLE `performance_improvement_plan` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pip_objective`
--

LOCK TABLES `pip_objective` WRITE;
/*!40000 ALTER TABLE `pip_objective` DISABLE KEYS */;
INSERT INTO `pip_objective` VALUES (1,NULL,0.00,'2026-04-30','Communication weak','Not_Started',100.00,NULL,NULL,100.00,1),(2,NULL,0.00,'2026-04-30','Communication weak','Not_Started',100.00,NULL,NULL,100.00,2),(3,NULL,0.00,'2026-04-28','aaa','Not_Started',100.00,NULL,NULL,100.00,3),(4,NULL,0.00,'2026-04-28','bbb','Not_Started',100.00,NULL,NULL,100.00,3),(5,NULL,0.00,'2026-04-28','ccc','Not_Started',100.00,NULL,NULL,100.00,3),(6,NULL,0.00,'2026-04-28','ddd','Not_Started',100.00,NULL,NULL,100.00,3);
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
INSERT INTO `position` VALUES (1,'HRM','2026-04-18 17:04:44.000000',3,'HR Manager','Active',NULL,1),(2,'HRS','2026-04-18 17:04:44.000000',5,'HR Specialist','Active',NULL,1),(3,'TL','2026-04-18 17:04:44.000000',4,'Team Lead','ACTIVE','2026-04-23 14:13:30.656419',3),(4,'SE','2026-04-18 17:04:44.000000',5,'Software Engineer','ACTIVE','2026-04-23 14:07:28.610977',4),(5,'ACC','2026-04-18 17:04:44.000000',5,'Accountant','ACTIVE','2026-04-24 15:03:52.502472',4),(6,'FM','2026-04-18 17:04:44.000000',3,'Finance Manager','Active',NULL,3),(7,'OM','2026-04-18 17:04:44.000000',3,'Operations Manager','Active',NULL,3),(8,'ED','2026-04-18 17:04:44.000000',1,'Executive Director','Active',NULL,4),(53,'CHRM','2026-04-22 13:55:37.000000',1,'CHAIRMAN','Active',NULL,1),(54,'CEO','2026-04-22 13:55:37.000000',2,'CEO','ACTIVE','2026-04-24 15:06:41.392668',1),(55,'COO','2026-04-22 13:55:37.000000',2,'COO','Active',NULL,1),(56,'GM','2026-04-22 13:55:37.000000',3,'GENERAL MANAGER','Active',NULL,2),(57,'EXTC','2026-04-22 13:55:37.000000',3,'EXTERNAL CONSULTANTS','Active',NULL,4),(58,'PSH','2026-04-22 13:55:37.000000',3,'PS HEAD','Active',NULL,3),(59,'SLH','2026-04-22 13:55:37.000000',4,'SALES HEAD','Active',NULL,3),(60,'PDH','2026-04-22 13:55:37.000000',4,'PRODUCT HEAD','Active',NULL,3),(61,'OMH','2026-04-22 13:55:37.000000',4,'OM HEAD','Active',NULL,3),(62,'MKH','2026-04-22 13:55:37.000000',4,'MARKETING HEAD','Active',NULL,3),(63,'SFO','2026-04-22 13:55:37.000000',4,'SENIOR FINANCE OFFICER','Active',NULL,4),(64,'SHO','2026-04-22 13:55:37.000000',4,'SENIOR HR OFFICER','Active',NULL,1),(65,'SAO','2026-04-22 13:55:37.000000',4,'SENIOR ADMIN OFFICER','Active',NULL,1),(66,'CLW','2026-04-22 13:55:37.000000',4,'CORPORATE LAWYER','Active',NULL,4),(67,'ACM','2026-04-22 13:55:37.000000',5,'ACCOUNT MANAGER','ACTIVE','2026-04-23 14:39:06.369887',3),(68,'PM','2026-04-22 13:55:37.000000',5,'PROJECT MANAGER','Active',NULL,3),(69,'CCS','2026-04-22 13:55:37.000000',5,'CALL CENTER SUPERVISOR','Active',NULL,4),(70,'LDS','2026-04-22 13:55:37.000000',6,'LEAD DESIGNER','Active',NULL,4),(71,'SSE','2026-04-22 13:55:37.000000',6,'SSE','Active',NULL,4),(72,'DES','2026-04-22 13:55:37.000000',6,'DESIGNER','Active',NULL,4),(73,'SLE','2026-04-22 13:55:37.000000',6,'SALES EXECUTIVE','Active',NULL,4),(74,'SLA','2026-04-22 13:55:37.000000',6,'SALES ADMIN','Active',NULL,3),(75,'TRS','2026-04-22 13:55:37.000000',6,'TRANSLATOR','ACTIVE','2026-04-23 14:13:38.949274',4),(76,'JFO','2026-04-22 13:55:37.000000',7,'JUNIOR FINANCE OFFICER','Active',NULL,4),(77,'JHO','2026-04-22 13:55:37.000000',7,'JUNIOR HR OFFICER','Active',NULL,1),(78,'JAO','2026-04-22 13:55:37.000000',7,'JUNIOR ADMIN OFFICER','Active',NULL,2),(79,'CCO','2026-04-22 13:55:37.000000',7,'CALL CENTER OFFICER','Active',NULL,4),(80,'OJT','2026-04-22 13:55:37.000000',8,'OJT','Active',NULL,4),(81,'DRV','2026-04-22 13:55:37.000000',9,'DRIVERS','Active',NULL,4),(82,'CLN','2026-04-22 13:55:37.000000',9,'CLEANERS','Active',NULL,4),(83,'SEC','2026-04-22 13:55:37.000000',9,'SECURITY','Active',NULL,4);
/*!40000 ALTER TABLE `position` ENABLE KEYS */;
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
-- Table structure for table `self_assessment`
--

DROP TABLE IF EXISTS `self_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment` (
  `assessment_id` bigint NOT NULL AUTO_INCREMENT,
  `approved_date` datetime(6) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `employee_remarks` text,
  `employee_signature_date` datetime(6) DEFAULT NULL,
  `hr_comments` text,
  `hr_signature_date` datetime(6) DEFAULT NULL,
  `manager_comments` text,
  `manager_signature_date` datetime(6) DEFAULT NULL,
  `rating_category` varchar(255) DEFAULT NULL,
  `reviewed_date` datetime(6) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `submitted_date` datetime(6) DEFAULT NULL,
  `total_score` double DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `cycle_id` bigint DEFAULT NULL,
  `correction_remarks` text,
  PRIMARY KEY (`assessment_id`),
  KEY `FKtnh3o44emjdk00uq3a2dhh0th` (`employee_id`),
  KEY `FKfpc7h463t2o9m1lc1m76jqrwy` (`cycle_id`),
  CONSTRAINT `FKfpc7h463t2o9m1lc1m76jqrwy` FOREIGN KEY (`cycle_id`) REFERENCES `appraisal_cycle` (`cycle_id`),
  CONSTRAINT `FKtnh3o44emjdk00uq3a2dhh0th` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment`
--

LOCK TABLES `self_assessment` WRITE;
/*!40000 ALTER TABLE `self_assessment` DISABLE KEYS */;
/*!40000 ALTER TABLE `self_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_answer`
--

DROP TABLE IF EXISTS `self_assessment_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_answer` (
  `answer_id` bigint NOT NULL AUTO_INCREMENT,
  `created_date` datetime(6) DEFAULT NULL,
  `rating_value` int NOT NULL,
  `remarks` text,
  `yes_no_answer` varchar(255) DEFAULT NULL,
  `assessment_id` bigint NOT NULL,
  `question_id` bigint NOT NULL,
  PRIMARY KEY (`answer_id`),
  KEY `FKhix8pfl2t973djvmbbx2idrwp` (`assessment_id`),
  KEY `FK9khbtf1v6qh7ol8t753yy12fm` (`question_id`),
  CONSTRAINT `FK9khbtf1v6qh7ol8t753yy12fm` FOREIGN KEY (`question_id`) REFERENCES `self_assessment_question` (`question_id`),
  CONSTRAINT `FKhix8pfl2t973djvmbbx2idrwp` FOREIGN KEY (`assessment_id`) REFERENCES `self_assessment` (`assessment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_answer`
--

LOCK TABLES `self_assessment_answer` WRITE;
/*!40000 ALTER TABLE `self_assessment_answer` DISABLE KEYS */;
/*!40000 ALTER TABLE `self_assessment_answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `self_assessment_question`
--

DROP TABLE IF EXISTS `self_assessment_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `self_assessment_question` (
  `question_id` bigint NOT NULL AUTO_INCREMENT,
  `sort_order` int DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `question_text` text NOT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `self_assessment_question`
--

LOCK TABLES `self_assessment_question` WRITE;
/*!40000 ALTER TABLE `self_assessment_question` DISABLE KEYS */;
/*!40000 ALTER TABLE `self_assessment_question` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `signatures`
--

LOCK TABLES `signatures` WRITE;
/*!40000 ALTER TABLE `signatures` DISABLE KEYS */;
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
/*!40000 ALTER TABLE `template_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_development_history`
--

DROP TABLE IF EXISTS `training_development_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_development_history` (
  `training_id` bigint NOT NULL AUTO_INCREMENT,
  `certification_received` bit(1) DEFAULT NULL,
  `completion_status` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text,
  `start_date` date NOT NULL,
  `training_name` varchar(255) NOT NULL,
  `training_provider` varchar(255) DEFAULT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `pip_id` bigint DEFAULT NULL,
  PRIMARY KEY (`training_id`),
  KEY `FK16ydg3tsfl0xs04u0y9ta4de8` (`employee_id`),
  KEY `FK7t84p9ewyfn76q3f5yigttlob` (`pip_id`),
  CONSTRAINT `FK16ydg3tsfl0xs04u0y9ta4de8` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `FK7t84p9ewyfn76q3f5yigttlob` FOREIGN KEY (`pip_id`) REFERENCES `performance_improvement_plan` (`pip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_development_history`
--

LOCK TABLES `training_development_history` WRITE;
/*!40000 ALTER TABLE `training_development_history` DISABLE KEYS */;
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
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UK8sdf3db63yd6xx596kboaod8x` (`employee_id`),
  KEY `FK4j8uoaeve853dcbl0tjd0yoq0` (`role_id`),
  CONSTRAINT `FK4j8uoaeve853dcbl0tjd0yoq0` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`),
  CONSTRAINT `FKb8rqi2da12ugm0e92y14yrv4t` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$ixAupEldTTcM0q1qZN9GmunKcEdAw4MtcvS93D3cosdrhq6wpcCHG',NULL,NULL,1,1,0,NULL,NULL,NULL,NULL),(2,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$sapPERgnfAfgR5NP3dUCz.IYhSDt.VpY57iwJgPuG9WVI.uh9sTb6',NULL,NULL,2,1,0,'wallpaper','English','UTC+06:30 (Yangon)','/api/public/profile-pictures/a1a60c39-b660-4693-88f3-10f1bf8a3acc.jpg'),(3,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$4Q.D1G.66pgCB4J1.RBiy.qI1AyjdxQVHQketgPXikFjacbpksacO',NULL,NULL,3,2,0,NULL,NULL,NULL,NULL),(4,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$5L8NFjUqr36wUzcLmgqFlehLG/dPNK22Z4VCK5un464.0g42VINrS',NULL,NULL,4,3,0,NULL,NULL,NULL,NULL),(5,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$HzTkAc9soHy8rW0GrdtNA.aW.RmsVZ/VTLKo/7SS89QoSCKQWGZkK',NULL,NULL,5,4,0,NULL,NULL,NULL,NULL),(6,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$2ul77rqJZFZ6fTNgvJw8guJfytWvdW5RAOrdQWCv6V0A/RvkX3Cfm',NULL,NULL,6,4,0,NULL,NULL,NULL,NULL),(7,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$u4CMKPnpa93XXWGpzKWLAO/D5zmgBge66HgtcIsR3KQZ4CljOFtt2',NULL,NULL,7,4,0,NULL,NULL,NULL,NULL),(8,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$aL4zeulH1ponFqqB.M1UIOjoLpDRf/by/N3DCC8xiRYt7qSNHZ/a6',NULL,NULL,8,3,0,NULL,NULL,NULL,NULL),(9,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$4RSOaw9kbbr7onv0SiRe3eWPzDlrI0raqrPOcDmJWDtchbet4GuD6',NULL,NULL,9,4,0,NULL,NULL,NULL,NULL),(10,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$2.XZt9E/pF/mShhc6lqh4u2t8uUpkFynFeoE4f0K7QXqlhI3FmIHi',NULL,NULL,10,3,0,NULL,NULL,NULL,NULL),(11,_binary '','2026-04-18 17:05:19.000000',NULL,'$2a$10$nvVqxDDRDe34U.JG9NUszOnZuVmWEk5E155dvgVTZCtj25a.13uaC',NULL,NULL,11,4,0,NULL,NULL,NULL,NULL),(12,_binary '','2026-04-18 17:06:12.000000',NULL,'$2a$10$NApx9u00nHTFUOzAxIdY3u3BaoxewgWTTqU9246ycDo0L/9wVldYy',NULL,NULL,12,1,0,NULL,NULL,NULL,NULL),(13,_binary '','2026-04-20 03:42:17.814880',NULL,'$2a$10$Y7hPDVK4kEhzFhONiux8nOWm1LP8p4f2S3oWlAcpXDxz6p6tSn5UW',NULL,NULL,13,4,0,NULL,NULL,NULL,NULL),(14,_binary '','2026-04-20 04:39:47.913237',NULL,'$2a$10$C.3tIdQOGdYYHLwV5FB6F.WQTc.YgnIFZjeXjn2x8hzBB187McsDW',NULL,NULL,14,3,0,NULL,NULL,NULL,NULL),(15,_binary '','2026-04-20 04:47:22.233432',NULL,'$2a$10$Szuq5Ems3WPdM3YhQOtl4uZ2quikIcWR9qKhg4dmNGcKpYER4Nrn.',NULL,NULL,15,4,1,NULL,NULL,NULL,NULL),(16,_binary '','2026-04-20 05:07:48.301493',NULL,'$2a$10$NZIT0kBxXyoGScKS6NiWq.YwON/jT3c0c1VWA48H1cb2s7FPfHh5a',NULL,NULL,16,4,0,NULL,NULL,NULL,NULL),(17,_binary '','2026-04-20 05:25:29.191919',NULL,'$2a$10$YkKV2Qa9UuN2FtCx6tkNhuzCU3wNCyeHZOCmtJw8HKBzbbtNO9hta',NULL,NULL,17,4,0,NULL,NULL,NULL,NULL),(18,_binary '','2026-04-20 05:34:52.994466',NULL,'$2a$10$LV0mtL8vU12jav7DPqUPfeOFV/xn/8fyiiWO6J2FnwFOoFbuglELy',NULL,NULL,18,4,0,NULL,NULL,NULL,NULL),(19,_binary '','2026-04-20 07:42:35.280025',NULL,'$2a$10$Z6rCsQRiRTwJW1FpVv4FbOUJfp2gze3.bCBvSXVYm3IzzwSENRT7O',NULL,NULL,19,4,0,NULL,NULL,NULL,NULL),(20,_binary '','2026-04-20 07:54:04.285681',NULL,'$2a$10$gOEWwVrkNLlQouPrKUlNKeJ.jI0btrQBSmMD3.vrm5GbDpRfrIz2e',NULL,NULL,20,4,0,NULL,NULL,NULL,NULL),(21,_binary '','2026-04-21 14:47:18.335487',NULL,'$2a$10$za27g0ACvqxGcE4vfIj5a.tBaBv987/AY9rJco1uCbU7KZ2ToA6Ru',NULL,NULL,21,4,0,NULL,NULL,NULL,NULL),(22,_binary '','2026-04-21 16:01:22.327025',NULL,'$2a$10$TMPrdE6byy177vX4yWL38e8tgqR3qS5sB8sD9t2DHNLX4wW41fxWm',NULL,NULL,22,4,0,NULL,NULL,NULL,NULL),(23,_binary '','2026-04-21 16:50:50.231215',NULL,'$2a$10$fl6dLuUMR7QrNbpbWrmJk.NkdcQJ5O4VMGXV0BdThtZLIkS5M.7SW',NULL,NULL,23,4,0,NULL,NULL,NULL,NULL),(27,_binary '','2026-04-21 19:35:40.771218',NULL,'$2a$10$.5a1lHnqLlVe8VkK2kZ7uOGSKkYeVdWxTj05.ldfIOnPIK0phzcG.',NULL,NULL,27,4,1,NULL,NULL,NULL,NULL),(29,_binary '','2026-04-22 03:04:09.250089',NULL,'$2a$10$MoSjINfncJEv0CPBDx72geFhn/9Q3nS99FkFp1jw9qc9td9Yngm26',NULL,NULL,29,2,0,NULL,NULL,NULL,NULL),(31,_binary '','2026-04-23 06:10:19.466063',NULL,'$2a$10$YUQRAC3CUqGXC6jj7pvrlOyVHGDeu9QxAnorexBpdnQ8gciqxrv9q',NULL,NULL,32,3,1,NULL,NULL,NULL,NULL),(32,_binary '','2026-04-23 09:38:23.759936',NULL,'$2a$10$XYdan1akP2AcIk/BDApMl.2PMy/d7/lZAWvyr9uHhll/NxNJix1M6',NULL,NULL,33,4,1,NULL,NULL,NULL,NULL),(33,_binary '','2026-04-23 09:38:29.666373',NULL,'$2a$10$rSZng/R3wLh9EmkrprFmb.nPvxmRDYRohB1rxR8Y.hEGcTel1x7GW',NULL,NULL,34,4,1,NULL,NULL,NULL,NULL),(35,_binary '','2026-04-23 14:32:08.633324',NULL,'$2a$10$GJ4njdwchURkAXkywlRLj.a.Wvhijv4nz3zexi5NmqlSwF2Ma.vKa',NULL,NULL,36,4,1,NULL,NULL,NULL,NULL),(36,_binary '','2026-04-23 17:37:09.883428',NULL,'$2a$10$xgN8T2Yul1jrpRxftqgMDugXUxJkidIMmyx1T0GYvL9CbsbIHwEXC',NULL,NULL,37,4,0,NULL,NULL,NULL,NULL),(37,_binary '','2026-04-23 17:39:23.529867',NULL,'$2a$10$pWSuy6R93BJhwx6zHofJPO1lV/7OhRCaIBO3t3bdD60atSOjf5jrK',NULL,NULL,38,4,0,NULL,NULL,NULL,NULL);
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

-- Dump completed on 2026-04-27 15:29:32
