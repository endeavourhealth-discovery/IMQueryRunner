DROP TABLE IF EXISTS concept_set_member;

CREATE TABLE concept_set_member
(
  `dbid`  INT AUTO_INCREMENT PRIMARY KEY,
  `parent`    VARCHAR(512) NOT NULL,
  `child` VARCHAR(512) NOT NULL,
  `im1id`  VARCHAR(150) NOT NULL,
  `self`   BIT,

  INDEX    idx_parent_self (`parent`, `self`),
  CONSTRAINT fk_parent FOREIGN KEY (`parent`) REFERENCES concept_set (`set`)
) ENGINE = INNODB DEFAULT CHARSET= UTF8MB4;

load data infile 'Z:\\Data\\tct_20250826105134.csv'
into table concept_set_member
FIELDS TERMINATED BY '\t'
(@s, @m, @i)
SET `parent` = @s,
     `member` = @m,
     `im1id` = @i,
     `self` = (`parent` == `member`)
;

DROP TABLE IF EXISTS `compass`.`cohort`;

CREATE TABLE `compass`.`cohort` (
  `dbid` INT NOT NULL,
  `hash` INT NOT NULL,
  `cohort_id` INT NOT NULL,
  PRIMARY KEY (`dbid`));

DROP TABLE IF EXISTS `compass`.`dataset`;

CREATE TABLE `compass`.`dataset` (
  `dbid` INT NOT NULL,
  `hash` INT NOT NULL,
  `cohort_id` INT NOT NULL,
  `group` VARCHAR(45) NOT NULL,
  `json` JSON NULL,
  PRIMARY KEY (`dbid`));
