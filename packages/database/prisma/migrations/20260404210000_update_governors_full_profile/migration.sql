-- ============================================================
-- Backfill governor profiles with image, bio, twitter, dob, etc.
-- Matches on state_code via the official_positions join to avoid
-- name-mismatch issues.
-- ============================================================

UPDATE "nigerian_officials" SET "name" = 'Hyacinth Alia', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Benue-State---Hyacinth-Alia.jpg', "twitter_handle" = 'HyacinthAlia', "date_of_birth" = '1966-05-15'::date, "gender" = 'male', "education" = 'Diploma in Religious Studies and BA in Sacred Theology, St. Augustine''s Major Seminary, Jos; MA in Religious Education, Fordham University, New York; MA and PhD in Biomedical Ethics, Duquesne University, Pennsylvania', "biography" = 'Catholic priest and politician serving as Governor of Benue State since 2023. Made history as the second Roman Catholic priest elected governor in Nigeria.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'benue'
);

UPDATE "nigerian_officials" SET "name" = 'Ahmed Usman Ododo', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Kogi_State_-_Ahmed_Usman_Ododo.jpg', "twitter_handle" = 'OfficialOAU', "date_of_birth" = '1978-01-01'::date, "gender" = 'male', "education" = 'ND in Accountancy, Federal Polytechnic Bida; BSc Accounting, Ahmadu Bello University, Zaria; MBA; PhD, University of Lagos', "biography" = 'Accountant and politician serving as Governor of Kogi State since 2024. Previously served as Auditor-General for Local Governments in Kogi State.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'kogi'
);

UPDATE "nigerian_officials" SET "name" = 'AbdulRahman AbdulRazaq', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/KWARA_GOV_2020.jpg', "twitter_handle" = 'RealAARahman', "date_of_birth" = '1960-02-05'::date, "gender" = 'male', "education" = 'WASC, Government College Kaduna', "biography" = 'Businessman and politician serving as Governor of Kwara State since 2019 (second term from 2023). Former CEO of First Fuels Limited and founder of NOPA Oil Services.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'kwara'
);

UPDATE "nigerian_officials" SET "name" = 'Abdullahi Sule', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/NASARAWA_GOV_2020.jpg', "twitter_handle" = 'AbdullahiASule', "date_of_birth" = '1959-12-26'::date, "gender" = 'male', "education" = 'BSc and MSc in Mechanical Technology, Indiana State University, USA', "biography" = 'Engineer and politician serving as Governor of Nasarawa State since 2019 (second term from 2023). Former Group Managing Director of Dangote Sugar Refinery Plc and CEO of African Petroleum Plc.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'nasarawa'
);

UPDATE "nigerian_officials" SET "name" = 'Mohammed Umar Bago', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Niger-State---Mohammed-Umar-Bago.png', "twitter_handle" = 'HonBago', "date_of_birth" = '1974-02-22'::date, "gender" = 'male', "education" = 'BSc Political Science, Usman Danfodio University, Sokoto; PGD Management, Federal University of Technology Minna; MBA Economics, Ambrose Ali University, Ekpoma', "biography" = 'Banker and politician serving as Governor of Niger State since 2023. Previously served three terms as member of the House of Representatives.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'niger'
);

UPDATE "nigerian_officials" SET "name" = 'Caleb Manasseh Mutfwang', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Plateau-State---Caleb-Mutfwang.png', "twitter_handle" = 'CalebMutfwang', "date_of_birth" = '1965-03-12'::date, "gender" = 'male', "education" = 'LLB, University of Jos; BL, Nigerian Law School', "biography" = 'Lawyer and politician serving as Governor of Plateau State since 2023. Former Chairman of Mangu Local Government Area.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'plateau'
);

UPDATE "nigerian_officials" SET "name" = 'Ahmadu Umaru Fintiri', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/ADAMAWA_GOV_2020.jpg', "twitter_handle" = 'GovernorAUF', "date_of_birth" = '1967-10-27'::date, "gender" = 'male', "education" = 'BA History, University of Maiduguri; PGD in Policy and Strategic Studies, University of Maiduguri', "biography" = 'Politician serving as Governor of Adamawa State since 2019. Previously served as Acting Governor in 2014 and as Speaker of the Adamawa State House of Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'adamawa'
);

UPDATE "nigerian_officials" SET "name" = 'Bala Mohammed', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/BAUCHI_GOV_2020.jpg', "twitter_handle" = 'SenBalaMohammed', "date_of_birth" = '1958-10-05'::date, "gender" = 'male', "education" = 'BA, University of Maiduguri; Management Course, Administrative Staff College of Nigeria (ASCON)', "biography" = 'Politician serving as Governor of Bauchi State since 2019. Former Minister of the Federal Capital Territory (2010-2015) and Senator for Bauchi South.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'bauchi'
);

UPDATE "nigerian_officials" SET "name" = 'Babagana Umara Zulum', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/BORNO_GOV_2020.jpg', "twitter_handle" = 'ProfZulum', "date_of_birth" = '1969-08-25'::date, "gender" = 'male', "education" = 'BSc Agricultural Engineering, University of Maiduguri; MSc Agricultural Engineering, University of Ibadan; PhD Soil and Water Engineering, University of Maiduguri', "biography" = 'Professor and politician serving as Governor of Borno State since 2019. Former Rector of Ramat Polytechnic, Maiduguri and Commissioner for Reconstruction, Rehabilitation and Resettlement.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'borno'
);

UPDATE "nigerian_officials" SET "name" = 'Muhammadu Inuwa Yahaya', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/GOMBE_GOV_2020.jpg', "twitter_handle" = 'GovernorInuwa', "date_of_birth" = '1961-10-09'::date, "gender" = 'male', "education" = 'BSc Accounting, Ahmadu Bello University, Zaria; Fellow of ANAN and NIM', "biography" = 'Accountant and politician serving as Governor of Gombe State since 2019. Fellow of the Association of National Accountants of Nigeria and the Nigerian Institute of Management.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'gombe'
);

UPDATE "nigerian_officials" SET "name" = 'Agbu Kefas', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Taraba-State---Agbu-Kefas.png', "twitter_handle" = 'GovAgbuKefas', "date_of_birth" = '1970-11-12'::date, "gender" = 'male', "education" = 'BSc Political Science and Defense Studies, Nigerian Defence Academy, Kaduna; MA Legal Criminology and Security Psychology, University of Ibadan; MPA, Delta State University; Certificate in Executive Education, Harvard Kennedy School', "biography" = 'Retired military officer and politician serving as Governor of Taraba State since 2023. Retired as a Lieutenant Colonel after 21 years of service in the Nigerian Army.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'taraba'
);

UPDATE "nigerian_officials" SET "name" = 'Mai Mala Buni', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Yobe-State---Mai-Mala-Buni.jpg', "twitter_handle" = 'GovBuni', "date_of_birth" = '1967-11-19'::date, "gender" = 'male', "education" = 'WAEC, Government Secondary School, Goniri; BSc International Relations, Espan Formation University, Benin Republic', "biography" = 'Politician serving as Governor of Yobe State since 2019. Former first elected National Secretary of the All Progressives Congress.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'yobe'
);

UPDATE "nigerian_officials" SET "name" = 'Umar Namadi', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Jigawa-State---Umar-Namadi.png', "twitter_handle" = 'uanamadi', "date_of_birth" = '1963-04-07'::date, "gender" = 'male', "education" = 'Teachers Grade II Certificate, Mallam Madori Teachers College; BSc Accounting, Bayero University, Kano; MBA, Bayero University, Kano; Fellow of ICAN', "biography" = 'Chartered accountant and politician serving as Governor of Jigawa State since 2023. Former Deputy Governor of Jigawa State and Commissioner of Finance.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'jigawa'
);

UPDATE "nigerian_officials" SET "name" = 'Uba Sani', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Kaduna-State---Uba-Sani.png', "twitter_handle" = 'ubasanius', "date_of_birth" = '1970-12-31'::date, "gender" = 'male', "education" = 'HND Mechanical Engineering, Kaduna Polytechnic; PGD Business Administration, University of Abuja; MSc Finance, University of Calabar', "biography" = 'Engineer and politician serving as Governor of Kaduna State since 2023. Former Senator representing Kaduna Central Senatorial District.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'kaduna'
);

UPDATE "nigerian_officials" SET "name" = 'Abba Kabir Yusuf', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Kano-State---Abba-Kabir-Yusuf.jpeg', "twitter_handle" = 'Kyusufabba', "date_of_birth" = '1963-01-05'::date, "gender" = 'male', "education" = 'ND Civil Engineering, Federal Polytechnic Mubi; HND Civil Engineering, Kaduna Polytechnic', "biography" = 'Engineer and politician serving as Governor of Kano State since 2023. Former Commissioner of Works, Housing and Transport in Kano State.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'kano'
);

UPDATE "nigerian_officials" SET "name" = 'Dikko Umaru Radda', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Katsina-State---Dikko-Umar-Radda.jpg', "twitter_handle" = 'dikko_radda', "date_of_birth" = '1969-09-10'::date, "gender" = 'male', "education" = 'NCE, Kafanchan College of Education; B-Tech Agricultural Economics, Abubakar Tafawa Balewa University; MSc Agricultural Extension and Rural Sociology, Ahmadu Bello University; PhD Agricultural Extension and Rural Sociology, Ahmadu Bello University', "biography" = 'Academic and politician serving as Governor of Katsina State since 2023. Former Director-General of the Small and Medium Enterprises Development Agency of Nigeria (SMEDAN).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'katsina'
);

UPDATE "nigerian_officials" SET "name" = 'Nasir Idris', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Kebbi-State--Nasir-Idris-2.jpg', "twitter_handle" = 'NasiridrisKG', "date_of_birth" = '1965-08-06'::date, "gender" = 'male', "education" = 'Diploma, The Polytechnic Birnin Kebbi; MBA, Usmanu Danfodio University; PhD in Education, Usmanu Danfodio University', "biography" = 'Politician and educator serving as Governor of Kebbi State since 2023.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'kebbi'
);

UPDATE "nigerian_officials" SET "name" = 'Ahmad Aliyu', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Sokoto-State---Ahmad-Aliyu.jpg', "twitter_handle" = 'SokotoGovernor', "date_of_birth" = '1970-01-01'::date, "gender" = 'male', "education" = 'HND Local Government Studies, Abdu Gusau Polytechnic; PGD Management, Usmanu Danfodio University; MBA, Usmanu Danfodio University; BSc Business Administration, Usmanu Danfodio University; PhD Business Administration, Nasarawa State University', "biography" = 'Accountant and politician serving as Governor of Sokoto State since 2023. Former Deputy Governor of Sokoto State (2015-2018).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'sokoto'
);

UPDATE "nigerian_officials" SET "name" = 'Dauda Lawal', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Zamfara-State---Dauda-Lawal.jpg', "twitter_handle" = 'daudalawal_', "date_of_birth" = '1965-09-02'::date, "gender" = 'male', "education" = 'BSc Political Science, Ahmadu Bello University; MSc Political Science/International Relations, Ahmadu Bello University; PhD Business Administration, Usmanu Danfodio University; Executive courses at Harvard Business School, Oxford University, and London School of Economics', "biography" = 'Banker and politician serving as Governor of Zamfara State since 2023. Former Executive Director, Public Sector North, First Bank of Nigeria.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'zamfara'
);

UPDATE "nigerian_officials" SET "name" = 'Alex Otti', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Abia-State---Alex-Otti.jpg', "twitter_handle" = 'alexottiofr', "date_of_birth" = '1965-02-18'::date, "gender" = 'male', "education" = 'BSc Economics (First Class), University of Port Harcourt; MBA, University of Lagos; Executive programs at Columbia Business School, Stanford, Wharton, and INSEAD', "biography" = 'Economist and banker serving as Governor of Abia State since 2023. Former Group Managing Director of Diamond Bank Plc.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'abia'
);

UPDATE "nigerian_officials" SET "name" = 'Charles Soludo', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Anambra---Charles-Soludo.png', "twitter_handle" = 'CCSoludo', "date_of_birth" = '1960-07-28'::date, "gender" = 'male', "education" = 'BSc Economics (First Class), University of Nigeria, Nsukka; MSc Economics, University of Nigeria, Nsukka; PhD Economics, University of Nigeria, Nsukka', "biography" = 'Professor and former Central Bank of Nigeria Governor (2004-2009) serving as Governor of Anambra State since 2022. Visiting scholar at IMF, Cambridge, Brookings Institution, and Oxford.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'anambra'
);

UPDATE "nigerian_officials" SET "name" = 'Francis Nwifuru', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Ebonyi-State---Francis-Nwifuru.jpg', "twitter_handle" = 'FrancisNwifuru', "date_of_birth" = '1975-02-25'::date, "gender" = 'male', "education" = 'Building Technology and Woodwork, Ebonyi State University; MSc Procurement, Logistics and Supply Chain Management, University of Salford, UK', "biography" = 'Politician serving as Governor of Ebonyi State since 2023. Former Speaker of the Ebonyi State House of Assembly for two consecutive terms.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'ebonyi'
);

UPDATE "nigerian_officials" SET "name" = 'Peter Mbah', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Enugu-State---Peter-Mbah.jpg', "twitter_handle" = 'PNMbah', "date_of_birth" = '1972-03-17'::date, "gender" = 'male', "education" = 'LLB, University of East London; BL, Nigerian Law School; LLM Maritime and Commercial Law, Lagos State University; MBA, IESE Business School, University of Navarra, Spain; PGD Strategy and Innovation, Said Business School, University of Oxford', "biography" = 'Maritime lawyer and entrepreneur serving as Governor of Enugu State since 2023. Founder and CEO of Pinnacle Oil and Gas Ltd.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'enugu'
);

UPDATE "nigerian_officials" SET "name" = 'Hope Uzodimma', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/H.E_Hope_Odidika_Uzodinma.jpg', "twitter_handle" = 'Hope_Uzodimma1', "date_of_birth" = '1958-12-12'::date, "gender" = 'male', "education" = 'Diploma and HND in Maritime Management Technology, Federal University of Technology Owerri; BSc International Studies and Diplomacy', "biography" = 'Politician serving as Governor of Imo State since 2020. Declared winner by Supreme Court in January 2020. Former Senator representing Imo West Senatorial District.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'imo'
);

UPDATE "nigerian_officials" SET "name" = 'Umo Eno', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Akwa-Ibom---Umo-Eno.png', "twitter_handle" = '_PastorUmoEno', "date_of_birth" = '1964-04-24'::date, "gender" = 'male', "education" = 'BSc Public Administration, University of Uyo; MSc Public Administration, University of Uyo', "biography" = 'Clergyman and politician serving as Governor of Akwa Ibom State since 2023. Founder of All Nations Christian Ministry International and Royalty Hotels.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'akwa_ibom'
);

UPDATE "nigerian_officials" SET "name" = 'Douye Diri', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Diri_Duoye_Bayelsa_Gov.jpg', "twitter_handle" = 'govdouyediri', "date_of_birth" = '1959-06-04'::date, "gender" = 'male', "education" = 'NCE, College of Education, Port Harcourt; BEd Political Science, University of Port Harcourt', "biography" = 'Politician serving as Governor of Bayelsa State since 2020. Sworn in following a Supreme Court ruling. Former Senator representing Bayelsa Central.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'bayelsa'
);

UPDATE "nigerian_officials" SET "name" = 'Bassey Otu', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Cross-River-State---Bassey-Otu---2.jpeg', "twitter_handle" = 'senatorbassey', "date_of_birth" = '1959-10-18'::date, "gender" = 'male', "education" = 'BSc Social Sciences, University of Calabar', "biography" = 'Politician and businessman serving as Governor of Cross River State since 2023. Former Senator for Cross River South and member of the House of Representatives.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'cross_river'
);

UPDATE "nigerian_officials" SET "name" = 'Sheriff Oborevwori', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Delta-State---Sheriff-Oborevwori.jpg', "twitter_handle" = 'RtHonSheriff', "date_of_birth" = '1963-06-19'::date, "gender" = 'male', "education" = 'BSc Political Science, Ambrose Ali University, Ekpoma; MSc Political Science, Delta State University, Abraka; Leadership Executive Certificate, Alliance Manchester Business School', "biography" = 'Politician serving as Governor of Delta State since 2023. Former Speaker of the Delta State House of Assembly (2017-2023).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'delta'
);

UPDATE "nigerian_officials" SET "name" = 'Monday Okpebholo', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/2024_Gallery/Monday_Okpebholo_Gov._Edo_State.jpg', "twitter_handle" = 'm_akpakomiza', "date_of_birth" = '1970-08-29'::date, "gender" = 'male', "education" = 'BSc Business Administration, University of Abuja', "biography" = 'Businessman and politician serving as Governor of Edo State since November 2024. Former Senator representing Edo Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'edo'
);

UPDATE "nigerian_officials" SET "name" = 'Siminalayi Fubara', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Rivers-State---Siminalayi-Fubara.jpg', "twitter_handle" = 'SimFubaraKSC', "date_of_birth" = '1975-01-28'::date, "gender" = 'male', "education" = 'BSc Accountancy, Rivers State University of Science and Technology; PGD Accounting, Enugu State University; MBA and MSc Finance, University of Port Harcourt', "biography" = 'Accountant and politician serving as Governor of Rivers State since 2023. Former Accountant General of Rivers State.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'rivers'
);

UPDATE "nigerian_officials" SET "name" = 'Biodun Abayomi Oyebanji', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Ekiti-State---Biodun-Oyebanji.jpg', "twitter_handle" = 'biodunaoyebanji', "date_of_birth" = '1967-12-21'::date, "gender" = 'male', "education" = 'BSc Political Science, Ondo State University (now Ekiti State University); MSc Political Science (International Relations and Strategic Studies), University of Ibadan', "biography" = 'Politician and former academic serving as Governor of Ekiti State since 2022. Former Secretary to the Ekiti State Government and university lecturer.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'ekiti'
);

UPDATE "nigerian_officials" SET "name" = 'Babajide Sanwo-Olu', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Lagos-State---Babajide-Sanwo-Olu.png', "twitter_handle" = 'jidesanwoolu', "date_of_birth" = '1965-06-25'::date, "gender" = 'male', "education" = 'BSc Surveying, University of Lagos; MBA, University of Lagos; Executive programs at JFK School of Government (Harvard), London Business School, and Lagos Business School', "biography" = 'Banker and politician serving as Governor of Lagos State since 2019. Former Managing Director of Lagos State Development and Property Corporation.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'lagos'
);

UPDATE "nigerian_officials" SET "name" = 'Dapo Abiodun', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Gov_DapoAbiodun_Ogun.JPG', "twitter_handle" = 'DapoAbiodunCON', "date_of_birth" = '1960-05-29'::date, "gender" = 'male', "education" = 'BBA Accounting, Kennesaw State University, Atlanta, USA', "biography" = 'Businessman and politician serving as Governor of Ogun State since 2019. Former Chairman/CEO of several companies including Heyden Petroleum Limited.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'ogun'
);

UPDATE "nigerian_officials" SET "name" = 'Lucky Aiyedatiwa', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Ondo_State_-_Lucky_Orimisan_Aiyedatiwa.png', "twitter_handle" = 'LuckyAiyedatiwa', "date_of_birth" = '1965-01-12'::date, "gender" = 'male', "education" = 'NCE Economics and Government, Lagos State College of Education; Advanced Diploma in Business Administration, University of Ibadan; MBA, University of Liverpool, UK; PGC Chief Executive Education, Lagos Business School', "biography" = 'Businessman and politician serving as Governor of Ondo State since December 2023. Became governor following the death of Governor Rotimi Akeredolu.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'ondo'
);

UPDATE "nigerian_officials" SET "name" = 'Ademola Adeleke', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/Osun-State---Ademola-Adeleke.jpeg', "twitter_handle" = 'AAdeleke_01', "date_of_birth" = '1960-05-13'::date, "gender" = 'male', "education" = 'Political Science and Criminal Justice studies, Jacksonville State University, Alabama; Criminal Justice degree, Atlanta Metropolitan State College', "biography" = 'Politician and businessman serving as Governor of Osun State since 2022. Member of the prominent Adeleke family of Ede, Osun State.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'osun'
);

UPDATE "nigerian_officials" SET "name" = 'Seyi Makinde', "image_url" = 'https://nggovernorsforum.org/media/jact/medium/images/Governors/OYO_GOV_2020.jpg', "twitter_handle" = 'seyiamakinde', "date_of_birth" = '1967-12-25'::date, "gender" = 'male', "education" = 'BSc Electrical Engineering, University of Lagos; Training at Industrial Control Services, Houston, Texas; Course at Lagos Business School; Program at MIT, USA', "biography" = 'Engineer and businessman serving as Governor of Oyo State since 2019. Successful entrepreneur in the oil and gas sector before entering politics.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'oyo'
);

UPDATE "nigerian_officials" SET "name" = 'Nyesom Wike', "twitter_handle" = 'GovWike', "date_of_birth" = '1967-12-13'::date, "gender" = 'male', "education" = 'LLB, Rivers State University of Science and Technology; BL, Nigerian Law School; MA Political and Administrative Studies, RSUST', "biography" = 'Lawyer and politician serving as Minister of the Federal Capital Territory since 2023. Former Governor of Rivers State (2015-2023). Previously served as Minister of State for Education and Federal Minister of Education under President Goodluck Jonathan.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'governor' AND "state_code" = 'fct'
);

