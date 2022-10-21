odoo.define('pos_pro_pack.pos_pro_pack', function (require) {
"use strict";

const PosComponent = require('point_of_sale.PosComponent');
const ProductScreen = require('point_of_sale.ProductScreen');
const { useListener } = require('web.custom_hooks');
const Registries = require('point_of_sale.Registries');
const models = require('point_of_sale.models');
const { useState, useRef } = owl.hooks;
const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');

    models.load_fields('product.product',['is_pack','is_fix_pack','is_selective_pack','item_limit','fix_pack_id','selective_pack_id']);

    models.load_models([{
        model: 'fix.product.pack',
        condition: function(self){ return self.config.allow_product_pack; },
        fields: ['product_id','qty'],
        loaded: function(self,result){
            if(result.length){
                self.wv_fix_pack_list = result;
            }
            else{
                self.wv_fix_pack_list = [];
            }
        },
    },{
        model: 'selective.product.pack',
        condition: function(self){ return self.config.allow_product_pack; },
        fields: ['product_id','default_selected','qty'],
        loaded: function(self,result){
            if(result.length){
                self.wv_selective_pack_list = result;
            }
            else{
                self.wv_selective_pack_list = [];
            }
        },
    },
    ],{'after': 'product.product'});

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr,options){
            var self = this;
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            
            var fix_products = false;
            if(options.product && options.product.is_pack && options.product.is_fix_pack){
                fix_products = options.product.fix_pack_id || false;
            }
            this.fix_product_ids = fix_products;

           
        },
        fixed_product_pack: function(pack_id,qty,unit){
            var self = this;
            var fixed_product = self.pos.wv_fix_pack_list;
            for(var i=0;i<fixed_product.length;i++){
                if(fixed_product[i].id == pack_id){
                    return "<em>"+fixed_product[i].qty * qty+"</em> "+fixed_product[i].product_id[1];
                }
            }
        },

        selected_product_pack: function(pack_id,qty,unit){
            var self = this;
            var selected_pack = self.pos.wv_selective_pack_list;
            for(var i=0;i<selected_pack.length;i++){
                if(selected_pack[i].id == pack_id){
                    return "<em>"+selected_pack[i].qty * qty+"</em> "+selected_pack[i].product_id[1];
                }
            }
        },
        fixed_product_pack_json: function(pack_id){
            var self = this;
            var fixed_product = self.pos.wv_fix_pack_list;
            for(var i=0;i<fixed_product.length;i++){
                if(fixed_product[i].id == pack_id){
                    return "<em>"+fixed_product[i].qty * qty+"</em> "+fixed_product[i].product_id[1];
                }
            }
        },
        selected_product_pack_json: function(pack_id){
            var self = this;
            var selected_pack = self.pos.wv_selective_pack_list;
            for(var i=0;i<selected_pack.length;i++){
                if(selected_pack[i].id == pack_id){
                    return {qty:selected_pack[i].qty * this.quantity,product_id:selected_pack[i].product_id[0],full_product_name:selected_pack[i].product_id[1],discount:0,price_unit:0,price_subtotal:0,price_subtotal_incl:0};
                }
            }
        },
        fixed_product_pack_tjson: function(pack_id){
            var self = this;
            var fixed_product = self.pos.wv_fix_pack_list;
            for(var i=0;i<fixed_product.length;i++){
                if(fixed_product[i].id == pack_id){
                    return {qty:fixed_product[i].qty * this.quantity,product_id:fixed_product[i].product_id[0],full_product_name:fixed_product[i].product_id[1],discount:0,price_unit:0,price_subtotal:0,price_subtotal_incl:0};
                }
            }
        },
        export_as_JSON: function(){
            var fixed_product_list = [];
            if(this.fix_product_ids){
                for(var i=0;i<this.fix_product_ids.length;i++){
                    fixed_product_list.push([0, 0, this.fixed_product_pack_tjson(this.fix_product_ids[i])]);
                }
            }
            var selected_product_list = [];
            if(this.selective_product_ids){
                for(var i=0;i<this.selective_product_ids.length;i++){
                    selected_product_list.push([0, 0, this.selected_product_pack_json(this.selective_product_ids[i])]);
                }
            }
            var data = OrderlineSuper.prototype.export_as_JSON.apply(this, arguments);
            data.fixed_product_list = fixed_product_list;
            data.selected_product_list = selected_product_list;
            return data;
        }
    });

   class SelectiveProductWidget extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            useListener('selective-product', this.selective_product);
            this.state = useState({ inputValue: this.props.startingValue });
        }
        getPayload() {
            var selected_product_list = [];
            $(".wv_product").each(function() {
                if($(this).hasClass('dark-border')){
                    var product_id = $(this).data('product-id');
                    selected_product_list.push(product_id);
                }
            });
            return selected_product_list;
        }
        selective_product(event){
            const value = event.detail;
            if($('.wv_product'+value.id).hasClass('dark-border')){
                $('.wv_product'+value.id).removeClass('dark-border');
            }
            else{
                var count = 0;
                var total = $('.base_product').data('count');
                $(".wv_product").each(function() {
                    if($('.wv_product'+value.id).hasClass('dark-border')){
                       count = count + 1;
                    }
                });
                if(count < total){
                    $('.wv_product'+value.id).addClass('dark-border');
                }
                else{
                    alert("Sorry you can add only "+total+" products")
                }
            } 
        }
        
    }
    SelectiveProductWidget.template = 'SelectiveProductWidget';
    SelectiveProductWidget.defaultProps = {
        confirmText: 'Ok',
        cancelText: 'Cancel',
        title: '',
        body: '',
    };

    Registries.Component.add(SelectiveProductWidget);

    class OrderlineEditPackButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }
        get selectedOrderline() {
            return this.env.pos.get_order().get_selected_orderline();
        }
        async onClick() {
            if (!this.selectedOrderline) return;
            var product_pack_list = [];
            var fixed_product_list= [];
            var fixed_product = this.env.pos.wv_fix_pack_list;
            var wv_selective_pack = this.env.pos.wv_selective_pack_list;
            var selectedOrderline = this.selectedOrderline;
            if(selectedOrderline.product.is_fix_pack){
                var pack_ids = selectedOrderline.product.fix_pack_id;
                for(var i=0;i<fixed_product.length;i++){
                    if(pack_ids.indexOf(fixed_product[i].id)>=0){
                        fixed_product_list.push(fixed_product[i]);
                    }
                }
                // options.fixed_product_list = fixed_product_list;
            }
            var pack_ids = selectedOrderline.product.selective_pack_id;
            for(var i=0;i<wv_selective_pack.length;i++){
                if(pack_ids.indexOf(wv_selective_pack[i].id)>=0){
                    product_pack_list.push(wv_selective_pack[i]);
                }
            }
            const { confirmed, payload: inputNote } = await this.showPopup('SelectiveProductWidget', {
                title: this.env._t('Pack Product'),
                fixed_product_list:fixed_product_list,
                product_pack_list:product_pack_list,
                product:selectedOrderline.product,
            });
            if (confirmed) {
                // this.selectedOrderline.set_note(inputNote);
                selectedOrderline.selective_product_ids = inputNote;
                selectedOrderline.trigger('change',selectedOrderline);
            }
        }
    }
    OrderlineEditPackButton.template = 'OrderlineEditPackButton';

    ProductScreen.addControlButton({
        component: OrderlineEditPackButton,
        condition: function() {
            return true;
        },
    });

    Registries.Component.add(OrderlineEditPackButton);
});

