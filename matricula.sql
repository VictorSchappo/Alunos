INSERT INTO MATERIAS (CURSO, SIGLA, PROFESSOR) VALUES 
('TI', 'Eng_Req', 1),
('TI', 'BD_II', 1),
('TI', 'POO_I', 1),
('TI', 'ARQ_I', 1),
('TI', 'VIV_EXI', 1);
GO

-- PROCEDURE DE MATRÍCULA
CREATE PROCEDURE MatricularAluno
    @NomeAluno VARCHAR(50),
    @Curso VARCHAR(10),
    @PerLetivo INT
AS
BEGIN
    DECLARE @MatriculaAluno INT
    
    -- Insert dos alunos
    INSERT INTO ALUNOS (NOME) VALUES (@NomeAluno)
    SET @MatriculaAluno = SCOPE_IDENTITY()

    -- Matricular o aluno nas disciplinas do curso
    INSERT INTO MATRICULA (MATRICULA, CURSO, MATERIA, PROFESSOR, PERLETIVO)
    SELECT @MatriculaAluno, MATERIAS.CURSO, MATERIAS.SIGLA, MATERIAS.PROFESSOR, @PerLetivo
    FROM MATERIAS
    WHERE MATERIAS.CURSO = @Curso
END
GO

-- PROCEDURE DE LANÇAMENTO DE NOTAS E FALTAS
CREATE PROCEDURE LancarNotasFaltas
    @Matricula INT,
    @Curso VARCHAR(10),
    @Materia VARCHAR(20),
    @Professor INT,
    @PerLetivo INT,
    @N1 FLOAT,
    @N2 FLOAT,
    @N3 FLOAT,
    @N4 FLOAT,
    @F1 INT,
    @F2 INT,
    @F3 INT,
    @F4 INT,
    @NotaExame FLOAT = NULL
AS
BEGIN
    -- Atualiza as notas e faltas do aluno
    UPDATE MATRICULA
    SET N1 = @N1, N2 = @N2, N3 = @N3, N4 = @N4,
        F1 = @F1, F2 = @F2, F3 = @F3, F4 = @F4
    WHERE MATRICULA = @Matricula
    AND CURSO = @Curso
    AND MATERIA = @Materia
    AND PROFESSOR = @Professor
    AND PERLETIVO = @PerLetivo

    -- Calculo a media, frequncia e o resultado final
    UPDATE MATRICULA
    SET MEDIA = (N1 + N2 + N3 + N4) / 4,
        TOTALFALTAS = F1 + F2 + F3 + F4,
        PERCFREQ = 100 - ((F1 + F2 + F3 + F4) * 100.0 / 72),
        RESULTADO = CASE
                       WHEN ((N1 + N2 + N3 + N4) / 4) >= 7 AND (100 - ((F1 + F2 + F3 + F4) * 100.0 / 72)) >= 75 THEN 'APROVADO'
                       WHEN ((N1 + N2 + N3 + N4) / 4) < 7 AND (100 - ((F1 + F2 + F3 + F4) * 100.0 / 72)) >= 75 THEN 'EXAME'
                       ELSE 'REPROVADO'
                    END
    WHERE MATRICULA = @Matricula
    AND CURSO = @Curso
    AND MATERIA = @Materia
    AND PROFESSOR = @Professor
    AND PERLETIVO = @PerLetivo
   
    -- Calculo de nota de exame
    IF @NotaExame IS NOT NULL
    BEGIN
        UPDATE MATRICULA
        SET MEDIAFINAL = (@NotaExame + MEDIA) / 2,
            RESULTADO = 
                CASE 
                    WHEN (@NotaExame + MEDIA) / 2 >= 5 THEN 'APROVADO'
                    ELSE 'REPROVADO'
                END
        WHERE MATRICULA = @Matricula AND CURSO = @Curso AND MATERIA = @Materia AND PROFESSOR = @Professor AND PERLETIVO = @PerLetivo;
    END;
END
GO