TRUNCATE TABLE product_variant_currency CASCADE;
TRUNCATE TABLE product_currency CASCADE;
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

INSERT INTO product_currency (value)
VALUES ('currency');

INSERT INTO product_currency (value)
VALUES ('currency2');

INSERT INTO product_currency (value)
VALUES ('currency3');

INSERT INTO product_currency (value)
VALUES ('currency4');

INSERT INTO product_currency (value)
VALUES ('currency5');

INSERT INTO product_variant_currency (product_currency_id, product_variant_id, price)
VALUES ((SELECT id from product_currency WHERE value = 'currency'),
        (SELECT id from product_variant WHERE sku = 'sku'), 45.45);

INSERT INTO product_variant_currency (product_currency_id, product_variant_id, price)
VALUES ((SELECT id from product_currency WHERE value = 'currency2'),
        (SELECT id from product_variant WHERE sku = 'sku2'), 55.45);

INSERT INTO product_variant_currency (product_currency_id, product_variant_id, price)
VALUES ((SELECT id from product_currency WHERE value = 'currency3'),
        (SELECT id from product_variant WHERE sku = 'sku3'), 65.45);

INSERT INTO product_variant_currency (product_currency_id, product_variant_id, price)
VALUES ((SELECT id from product_currency WHERE value = 'currency4'),
        (SELECT id from product_variant WHERE sku = 'sku4'), 75.45);

INSERT INTO product_variant_currency (product_currency_id, product_variant_id, price)
VALUES ((SELECT id from product_currency WHERE value = 'currency5'),
        (SELECT id from product_variant WHERE sku = 'sku5'), 85.45);
