INSERT INTO user_simple (email, first_name, last_name, phone)
VALUES ('atesting@gmail.com', 'first_name', 'last_name', '555-555-5555');

INSERT INTO user_simple (email, first_name, last_name, phone)
VALUES ('ctesting3@gmail.com', 'first_name3', 'last_name3', '555-555-5553');

INSERT INTO user_simple (email, first_name, last_name, phone)
VALUES ('dtesting4@gmail.com', 'first_name4', 'last_name4', '555-555-5554');

INSERT INTO user_simple (email, first_name, last_name, phone)
VALUES ('btesting2@gmail.com', 'first_name2', 'last_name2', '555-555-5552');

INSERT INTO user_simple (email, first_name, last_name, phone)
VALUES ('etesting5@gmail.com', 'first_name5', 'last_name5', '555-555-55551');

INSERT INTO authorization_permission
VALUES (DEFAULT, 'aname', 'atype', 'description');

INSERT INTO authorization_permission
VALUES (DEFAULT, 'dname4', 'dtype4', 'description4');

INSERT INTO authorization_permission
VALUES (DEFAULT, 'ename5', 'etype5', 'description5');

INSERT INTO authorization_permission
VALUES (DEFAULT, 'bname2', 'read', 'description2');

INSERT INTO authorization_permission
VALUES (DEFAULT, 'cname3', 'ctype3', 'description3');

INSERT INTO authorization_role
VALUES (DEFAULT, 'aname', 'description');

INSERT INTO authorization_role
VALUES (DEFAULT, 'dname4', 'description4');

INSERT INTO authorization_role
VALUES (DEFAULT, 'ename5', 'description5');

INSERT INTO authorization_role
VALUES (DEFAULT, 'bname2', 'description2');

INSERT INTO authorization_role
VALUES (DEFAULT, 'cname3', 'description3');


INSERT INTO authorization_role_permission
VALUES ((SELECT id FROM authorization_role WHERE name = 'aname'),
        (SELECT id FROM authorization_permission WHERE name = 'aname'));

INSERT INTO authorization_role_user
VALUES ((SELECT id FROM authorization_role WHERE name = 'aname'),
        (SELECT id FROM user_simple WHERE first_name = 'first_name'));

INSERT INTO authorization_role_permission
VALUES ((SELECT id FROM authorization_role WHERE name = 'bname2'),
        (SELECT id FROM authorization_permission WHERE name = 'bname2'));

INSERT INTO authorization_role_user
VALUES ((SELECT id FROM authorization_role WHERE name = 'bname2'),
        (SELECT id FROM user_simple WHERE first_name = 'first_name2'));

INSERT INTO authorization_role_permission
VALUES ((SELECT id FROM authorization_role WHERE name = 'cname3'),
        (SELECT id FROM authorization_permission WHERE name = 'cname3'));

INSERT INTO authorization_role_user
VALUES ((SELECT id FROM authorization_role WHERE name = 'cname3'),
        (SELECT id FROM user_simple WHERE first_name = 'first_name3'));

INSERT INTO authorization_role_user
VALUES ((SELECT id FROM authorization_role WHERE name = 'bname2'),
        (SELECT id FROM user_simple WHERE first_name = 'first_name3'));

INSERT INTO authorization_role_permission
VALUES ((SELECT id FROM authorization_role WHERE name = 'dname4'),
        (SELECT id FROM authorization_permission WHERE name = 'dname4'));

INSERT INTO authorization_role_user
VALUES ((SELECT id FROM authorization_role WHERE name = 'dname4'),
        (SELECT id FROM user_simple WHERE first_name = 'first_name4'));

INSERT INTO authorization_role_permission
VALUES ((SELECT id FROM authorization_role WHERE name = 'ename5'),
        (SELECT id FROM authorization_permission WHERE name = 'ename5'));

INSERT INTO authorization_role_user
VALUES ((SELECT id FROM authorization_role WHERE name = 'ename5'),
        (SELECT id FROM user_simple WHERE first_name = 'first_name5'));