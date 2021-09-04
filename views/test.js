const app = new Vue({
  el: "#app",
  data: {
    products: [
      {id:1, name:'Boots', quantity:1},
      {id:2, name:'Jacket', quantity:0},
      {id:3, name:'Hiking Socks', quantity:5}
    ]
  },
  computed: {
    totalProducts(){
      return this.products.reduce((sum, product)=>{
        return sum + product.quantity;
      }, 0)
    }
  }
})
