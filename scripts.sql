ALTER TABLE jobs 
MODIFY COLUMN status ENUM('bookmark', 'applied', 'interview', 'accepted', 'rejected') 
DEFAULT 'applied' NOT NULL;