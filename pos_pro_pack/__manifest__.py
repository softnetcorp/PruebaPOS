# -*- coding: utf-8 -*-

{
    'name': 'Pos product pack',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'author': 'Webveer',
    'summary': 'Pos product pack allow you to create fixed and selective product pack.',
    'description': """

=======================
Pos product pack allow you to create fixed and selective product pack.

""",
    'depends': ['point_of_sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml'
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'images': [
        'static/description/fix_select_popup.jpg',
    ],
    'installable': True,
    'website': '',
    'auto_install': False,
    'price': 60,
    'currency': 'EUR',
}
