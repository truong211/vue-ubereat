import apiService from './api.service';

class SocialSharingService {
  /**
   * Share content on various social media platforms
   * @param {string} platform - The platform to share on (facebook, twitter, telegram, etc)
   * @param {Object} content - The content to share (title, description, url, image)
   */
  async shareContent(platform, content) {
    const baseUrl = window.location.origin;
    const shareUrl = new URL(`${baseUrl}/share`);
    
    switch (platform.toLowerCase()) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url || window.location.href)}&quote=${encodeURIComponent(content.title || '')}`, '_blank');
        break;
        
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(content.title || '')}&url=${encodeURIComponent(content.url || window.location.href)}`, '_blank');
        break;
        
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(content.url || window.location.href)}&text=${encodeURIComponent(content.title || '')}`, '_blank');
        break;
        
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent((content.title || '') + ' ' + (content.url || window.location.href))}`, '_blank');
        break;
        
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(content.title || '')}&body=${encodeURIComponent((content.description || '') + ' ' + (content.url || window.location.href))}`;
        break;
        
      default:
        console.error('Unsupported sharing platform');
        return false;
    }
    
    // Log share activity if user is logged in
    try {
      await this.logSocialShare(platform, content);
      return true;
    } catch (error) {
      console.error('Error logging social share:', error);
      return true; // Still return true as the share action has been initiated
    }
  }
  
  /**
   * Share a restaurant
   * @param {string} platform - Platform to share on
   * @param {Object} restaurant - Restaurant data
   */
  shareRestaurant(platform, restaurant) {
    const baseUrl = window.location.origin;
    const restaurantUrl = `${baseUrl}/restaurant/${restaurant.id}`;
    
    return this.shareContent(platform, {
      title: `Check out ${restaurant.name} on UberEat!`,
      description: restaurant.description || `Delicious food from ${restaurant.name}`,
      url: restaurantUrl,
      image: restaurant.image
    });
  }
  
  /**
   * Share a food item
   * @param {string} platform - Platform to share on
   * @param {Object} food - Food item data
   * @param {Object} restaurant - Restaurant data
   */
  shareFood(platform, food, restaurant) {
    const baseUrl = window.location.origin;
    const foodUrl = `${baseUrl}/restaurant/${restaurant.id}/food/${food.id}`;
    
    return this.shareContent(platform, {
      title: `Check out ${food.name} from ${restaurant.name} on UberEat!`,
      description: food.description || `Delicious ${food.name} from ${restaurant.name}`,
      url: foodUrl,
      image: food.image
    });
  }
  
  /**
   * Share an order
   * @param {string} platform - Platform to share on
   * @param {Object} order - Order data
   */
  shareOrder(platform, order) {
    const baseUrl = window.location.origin;
    const orderUrl = `${baseUrl}/order/${order.id}`;
    
    return this.shareContent(platform, {
      title: `I just ordered from ${order.restaurant.name} on UberEat!`,
      description: `Check out my order from ${order.restaurant.name}`,
      url: orderUrl,
      image: order.restaurant.image
    });
  }
  
  /**
   * Log social share activity
   * @param {string} platform - Platform shared on
   * @param {Object} content - Content that was shared
   * @private
   */
  async logSocialShare(platform, content) {
    return apiService.post('/social/share-log', {
      platform,
      content_type: content.type || 'unknown',
      content_id: content.id || null,
      url: content.url || window.location.href
    });
  }
}

export const socialSharingService = new SocialSharingService(); 