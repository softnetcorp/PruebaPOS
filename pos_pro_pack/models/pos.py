# -*- coding: utf-8 -*-

from odoo import fields, models,tools,api

class pos_config(models.Model):
    _inherit = 'pos.config' 

    allow_product_pack = fields.Boolean('Allow product pack', default=True)

class fix_product_pack(models.Model):
    _name = 'fix.product.pack'

    product_id = fields.Many2one('product.product','Product')
    product_ids = fields.Many2one('product.product','Product')
    qty = fields.Float("Quantity",default=1)

class selective_product_pack(models.Model):
    _name = 'selective.product.pack'

    product_id = fields.Many2one('product.product','Product')
    product_ids = fields.Many2one('product.product','Product')
    default_selected = fields.Boolean('Default selected')
    qty = fields.Float("Quantity",default=1)

class product_product(models.Model):
    _inherit = 'product.product'
    
    is_pack = fields.Boolean('Is Pack')
    is_fix_pack = fields.Boolean('Is Fix pack', default=True)
    is_selective_pack = fields.Boolean('Is selective pack')
    item_limit = fields.Integer("Selective Item limit")
    fix_pack_id = fields.One2many('fix.product.pack','product_ids',string="Fix Pack")
    selective_pack_id = fields.One2many('selective.product.pack','product_ids',string="Selective Pack")

    
class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    def _order_fields(self, ui_order):
        new_lines = []
        if 'lines' in ui_order:
            for lines in ui_order['lines']:
                new_lines.append(lines)
                if 'selected_product_list' in lines[2]:
                    for selected_pack in lines[2]['selected_product_list']:
                        new_lines.append(selected_pack)
                    del lines[2]['selected_product_list']
                if 'fixed_product_list' in lines[2]:
                    for fixed_pack in lines[2]['fixed_product_list']:
                        new_lines.append(fixed_pack)
                    del lines[2]['fixed_product_list']
            ui_order['lines'] = new_lines
        return super(PosOrder, self)._order_fields(ui_order)



