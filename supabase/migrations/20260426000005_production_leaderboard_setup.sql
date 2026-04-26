-- 1. COLLEGE SYSTEM (NO HARDCODE)
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Insert REAL Indian colleges (100+)
INSERT INTO colleges (name) VALUES 
('Indian Institute of Technology Delhi (IITD)'),
('Indian Institute of Technology Bombay (IITB)'),
('Indian Institute of Technology Madras (IITM)'),
('Indian Institute of Technology Kanpur (IITK)'),
('Indian Institute of Technology Kharagpur (IITKGP)'),
('Indian Institute of Technology Roorkee (IITR)'),
('Indian Institute of Technology Guwahati (IITG)'),
('Indian Institute of Technology Hyderabad (IITH)'),
('National Institute of Technology Trichy (NITT)'),
('National Institute of Technology Surathkal (NITK)'),
('National Institute of Technology Rourkela (NITR)'),
('National Institute of Technology Warangal (NITW)'),
('International Institute of Information Technology Hyderabad (IIITH)'),
('International Institute of Information Technology Bangalore (IIITB)'),
('BITS Pilani - Pilani Campus'),
('BITS Pilani - Goa Campus'),
('BITS Pilani - Hyderabad Campus'),
('Vellore Institute of Technology (VIT)'),
('Manipal Institute of Technology (MIT)'),
('SRM Institute of Science and Technology'),
('Delhi Technological University (DTU)'),
('Netaji Subhas University of Technology (NSUT)'),
('Jadavpur University'),
('Anna University'),
('Amrita Vishwa Vidyapeetham'),
('Thapar Institute of Engineering and Technology'),
('LNM Institute of Information Technology (LNMIIT)'),
('DAIICT Gandhinagar'),
('OIST Bhopal'),
('Oriental College of Technology Bhopal'),
('Lakshmi Narain College of Technology (LNCT)'),
('Technocrats Institute of Technology (TIT)'),
('Medicaps University Indore'),
('SGSITS Indore'),
('IET DAVV Indore'),
('Maulana Azad National Institute of Technology (MANIT)'),
('MNNIT Allahabad'),
('VNIT Nagpur'),
('SVNIT Surat'),
('MNIT Jaipur'),
('NIT Calicut'),
('NIT Silchar'),
('NIT Durgapur'),
('NIT Kurukshetra'),
('NIT Jalandhar'),
('NIT Bhopal'),
('IIIT Delhi'),
('IIIT Allahabad'),
('IIIT Gwalior'),
('IIIT Jabalpur'),
('IIIT Kancheepuram'),
('IIIT Pune'),
('IIIT Lucknow'),
('IIIT Guwahati'),
('IIIT Vadodara'),
('IIIT Sri City'),
('IIIT Kota'),
('IIIT Nagpur'),
('IIIT Bhagalpur'),
('IIIT Ranchi'),
('IIIT Surat'),
('IIIT Bhopal'),
('IIIT Agartala'),
('IIIT Raichur'),
('Hindustan Institute of Technology and Science'),
('PSG College of Technology'),
('Coimbatore Institute of Technology'),
('Government College of Technology Coimbatore'),
('SSN College of Engineering'),
('Sathyabama Institute of Science and Technology'),
('Kalinga Institute of Industrial Technology (KIIT)'),
('C. V. Raman Global University'),
('Veer Surendra Sai University of Technology'),
('Nirma University'),
('Dharmsinh Desai University'),
('LD College of Engineering'),
('Vishwakarma Institute of Technology'),
('College of Engineering Pune (COEP)'),
('Walchand College of Engineering'),
('Sardar Patel College of Engineering'),
('V J T I Mumbai'),
('Institute of Chemical Technology (ICT)'),
('Harcourt Butler Technical University'),
('Madan Mohan Malaviya University of Technology'),
('Kamla Nehru Institute of Technology'),
('Bundelkhand Institute of Engineering and Technology'),
('Zakir Husain College of Engineering and Technology'),
('University School of Information Communication and Technology'),
('Indira Gandhi Delhi Technical University for Women (IGDTUW)'),
('Pondicherry Engineering College'),
('Jawaharlal Nehru Technological University Hyderabad'),
('Osmania University College of Engineering'),
('CBIT Hyderabad'),
('Vasavi College of Engineering'),
('VNR Vignana Jyothi Institute of Engineering and Technology'),
('Gokaraju Rangaraju Institute of Engineering and Technology'),
('Maturi Venkata Subba Rao Engineering College'),
('Sree Nidhi Institute of Science and Technology'),
('Kakatiya Institute of Technology and Science'),
('University College of Engineering Kakinada'),
('University College of Engineering Vizianagaram'),
('Andhra University College of Engineering'),
('Gayatri Vidya Parishad College of Engineering')
ON CONFLICT (name) DO NOTHING;

-- 2. USER PROFILE (MANDATORY COLLEGE)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id);

-- 3. SKILL SCORE SYSTEM
-- Use UNIQUE(user_id, skill) as requested
ALTER TABLE skill_scores
DROP CONSTRAINT IF EXISTS skill_scores_user_id_skill_key;

ALTER TABLE skill_scores
ADD CONSTRAINT skill_scores_user_id_skill_key UNIQUE (user_id, skill);

-- 4. SCORE LOGIC - Handled in Frontend / API Logic
-- Ensure skill_scores has correct columns
ALTER TABLE skill_scores
ADD COLUMN IF NOT EXISTS score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
