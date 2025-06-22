START TRANSACTION;

CREATE TABLE ANNEE(
    annee SMALLINT PRIMARY KEY CHECK(annee > 2000)
);

CREATE TABLE club(
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    ville VARCHAR(100) NOT NULL
);

COMMENT ON TABLE club is 'Table représentant les clubs d''athlétisme';
COMMENT ON COLUMN club.nom is 'Nom du club';


CREATE TABLE coureur(
  id SERIAL PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  naissance DATE NOT NULL,
  sexe CHAR(1) NOT NULL CHECK(sexe IN ('M','F'))
);

CREATE TABLE categorie_age(
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(10),
    age_debut SMALLINT NOT NULL CHECK(age_debut > 0),
    age_fin SMALLINT,
    CONSTRAINT ck_age_fin_superieur_age_debut CHECK(age_fin IS NULL OR age_fin >= age_debut)
);

CREATE TABLE manifestation (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL
);

CREATE TABLE type_epreuve(
    ID SERIAL PRIMARY KEY,
    libelle TEXT NOT NULL,
    distance SMALLINT NOT NULL
);

CREATE TABLE epreuve(
    id SERIAL PRIMARY KEY,
    manifestation_id INTEGER NOT NULL REFERENCES manifestation(id),
    type_epreuve_id INTEGER NOT NULL REFERENCES type_epreuve(id),
    "date" DATE NOT NULL,
    heure TIME NOT NULL
);

CREATE TABLE inscription(
    id SERIAL PRIMARY KEY,
    coureur_id INTEGER NOT NULL,
    categorie_id INTEGER NOT NULL REFERENCES categorie_age(id),
    epreuve_id INTEGER NOT NULL,
    dossard INTEGER CHECK(dossard >= 0 AND dossard <= 99999),
    certificat_medical BOOLEAN NOT NULL DEFAULT false,
    "date" DATE NOT NULL,
    age SMALLINT NOT NULL CHECK(age >= 10),
    taille VARCHAR(3) NOT NULL DEFAULT 'L' 
        CHECK(taille IN ('S', 'M', 'L', 'XL', 'XXL')),
    statut VARCHAR(20) NOT NULL 
        DEFAULT 'INSCRIPTION EN COURS' 
        CHECK(statut IN ('INSCRIPTION EN COURS', 'INSCRIT', 'COMPLETE')),
    temps_annonce SMALLINT,
    temps_effectue REAL,
    CONSTRAINT uq_inscription_coureur_par_epreuve UNIQUE (coureur_id, epreuve_id),
    CONSTRAINT fk_coureur_inscription FOREIGN KEY(coureur_id) REFERENCES coureur(id),
    CONSTRAINT fk_epreuve_inscription FOREIGN KEY(epreuve_id) REFERENCES epreuve(id)
);

CREATE TABLE adhesion(
    coureur_id INTEGER NOT NULL,
    annee SMALLINT NOT NULL,
    cotisation SMALLINT NOT NULL CHECK(cotisation >= 0),
    licence INTEGER UNIQUE NOT NULL,
    club_id INTEGER NOT NULL,
    PRIMARY KEY (coureur_id, annee),
    CONSTRAINT fk_annee FOREIGN KEY(annee) REFERENCES annee(annee),
    CONSTRAINT fk_club FOREIGN KEY(club_id) REFERENCES club(id),
    CONSTRAINT fk_coureur FOREIGN KEY(coureur_id) REFERENCES coureur(id)
);

CREATE INDEX IDX_PK_ADHESION ON adhesion(coureur_id, annee);

CREATE INDEX IDX_FK_ADHESION_A_PR_CLUB ON adhesion(club_id);

/*
* Table de log d'inscriptions (utile pour la partie sur les TRIGGERS)
*/
CREATE TABLE log_inscription(
	coureur_id INTEGER NOT NULL REFERENCES COUREUR (id),
	epreuve_id INTEGER NOT NULL REFERENCES EPREUVE (id),
	ancien_statut VARCHAR(20) NULL  
        CHECK(ancien_statut IN ('INSCRIPTION EN COURS', 'INSCRIT', 'COMPLETE')),
	nouveau_statut VARCHAR(20) NOT NULL 
        DEFAULT 'INSCRIPTION EN COURS' 
        CHECK(nouveau_statut IN ('INSCRIPTION EN COURS', 'INSCRIT', 'COMPLETE')),
	date_modif TIMESTAMP NOT NULL
);

COMMIT;