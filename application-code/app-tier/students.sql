USE webappdb;

CREATE TABLE IF NOT EXISTS students (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  salary VARCHAR(100) NOT NULL,
  field VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
);

-- Optional sample record
INSERT INTO students (name, salary, field) VALUES ('Aarav Mehta', '25000', 'AWS');

SELECT * FROM students;
