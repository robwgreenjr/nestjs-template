TRUNCATE TABLE authentication_api_key CASCADE;

INSERT INTO authentication_api_key (key, role_id)
VALUES ('test-key', (SELECT id from authorization_role WHERE name = 'aname'));

INSERT INTO authentication_api_key (key, role_id)
VALUES ('test-key2', (SELECT id from authorization_role WHERE name = 'dname4'));

INSERT INTO authentication_api_key (key, role_id)
VALUES ('test-key3', (SELECT id from authorization_role WHERE name = 'ename5'));

INSERT INTO authentication_api_key (key, role_id)
VALUES ('test-key4', (SELECT id from authorization_role WHERE name = 'bname2'));

INSERT INTO authentication_api_key (key, role_id)
VALUES ('test-key5', (SELECT id from authorization_role WHERE name = 'cname3'));