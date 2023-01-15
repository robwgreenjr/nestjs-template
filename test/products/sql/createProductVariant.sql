TRUNCATE TABLE product_variant CASCADE;
TRUNCATE TABLE product CASCADE;

INSERT INTO product (pid, name, url)
VALUES ('pid', 'name', 'url.com');

INSERT INTO product (pid, name, url)
VALUES ('pid2', 'name2', 'url2.com');

INSERT INTO product (pid, name, url)
VALUES ('pid3', 'name3', 'url3.com');

INSERT INTO product (pid, name, url)
VALUES ('pid4', 'name4', 'url4.com');

INSERT INTO product (pid, name, url)
VALUES ('pid5', 'name5', 'url5.com');

INSERT INTO product_variant (product_id, sku, url)
VALUES ((SELECT id from product WHERE pid = 'pid'), 'sku', 'sku.com');

INSERT INTO product_variant (product_id, sku, url)
VALUES ((SELECT id from product WHERE pid = 'pid2'), 'sku2', 'sku2.com');

INSERT INTO product_variant (product_id, sku, url)
VALUES ((SELECT id from product WHERE pid = 'pid3'), 'sku3', 'sku3.com');

INSERT INTO product_variant (product_id, sku, url)
VALUES ((SELECT id from product WHERE pid = 'pid4'), 'sku4', 'sku4.com');

INSERT INTO product_variant (product_id, sku, url)
VALUES ((SELECT id from product WHERE pid = 'pid5'), 'sku5', 'sku5.com');
