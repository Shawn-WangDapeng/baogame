
var userCount = 0;
var User = function (game, name) {
	this.id = userCount++;
	this.game = game;
	this.name = name;
	this.onFloor = false;
	this.onPilla = false;
	this.nearPilla = false;
	this.dead = false;
	this.rolling = false;
	this.crawl = false;
	this.x = Math.random() * (game.props.w - 300) + 150;
	this.y = 380;
	this.vx = 0;
	this.vy = 0;
	this.dieing = false;
	this.faceing = 1;
	this.danger = false;
	this.ignore = [];
	this.carry = '';
	this.carryCount = 0;
	this.fireing = 0;
	this.mining = 0;
	this.score = 0;
	this.hasDoubleJump = false;
	this.canDoubleJump = false;
	this.lastTouch = null;
}
User.prototype.getStatus = function () {
	this.crawl = false;
	if (this.dieing) {return "dieing";}
	if ((this.vy <= 0 || this.onPilla) && this.game.checkMine(this)) {
		return "dieing";
	}
	if (this.onPilla && this.vx == 0 && this.vy == 0) {
		return "climbing";
	} else {
		var onFloor = this.game.map.onFloor(this.x, this.y);
		this.onFloor = onFloor;
		this.nearPilla = this.game.map.nearPilla(this);
		if (onFloor && this.vy <= 0) {
			if (this.rolling) {
				this.rollPoint--;
				if (this.rollPoint <= 0) {
					this.vx = 0;
					this.rolling = false;
				} else {
					this.crawl = true;
					return  "rolling2";
				}
			}
			if (this.danger) {
				if (Math.abs(this.vx) < .2) {
					this.danger = false;
					return  "standing";
				} else {
					return  "rolling";
				}
			} 
			if (this.fireing > 0) {
				this.fireing--;
				if (this.fireing == 5) {
					this.carryCount--;
					this.game.checkShot(this);
				}
				if (this.fireing > 0) {
					return 'fireing';
				}
			} 
			if (this.mining > 0) {
				this.mining--;
				if (this.mining == 0) {
					this.game.addMine(this) && this.carryCount--;
				} else {
					return 'mining';
				}
			}
			if ((this.upDown || this.downDown) && this.nearPilla) {
				this.onPilla = true;
				this.onFloor = false;
				this.vx = 0;
				this.pilla = this.nearPilla;
				this.x = this.pilla.x * this.game.props.blockWidth;
				return "climbing";
			} else if (this.downDown) {
				this.crawl = true;
				if (Math.abs(this.vx) < .2) {
					return  "crawling";
				} else {
					this.rolling = true;
					this.rollPoint = 20;
					if (this.vx > 0) {this.vx += 2}
					if (this.vx < 0) {this.vx -= 2}
					return "rolling2";
				}
				
			} else if (this.itemPress && this.vx == 0 && this.carry == 'gun' && this.carryCount > 0) {
				this.fireing = 20;
				return 'fireing';
			} else if (this.itemDown && this.vx == 0 && this.carry == 'mine' && this.carryCount > 0) {
				this.mining = 20;
				return 'mining';
			} else {
				this.lastTouch = null;
				if (this.hasDoubleJump) {
					this.canDoubleJump = true;
				}
				return "standing";
			}
		} else {
			return "falling";
		}
	}
}
User.prototype.update = function () {
	this.doubleJumping = false;
	this.flying = false;

	for (var key in this.ignore) {
		this.ignore[key]--;
	}
	
	if (this.carry == "power" || this.carry == "hide" || this.carry == "bomb") {
		this.carryCount--;
		if (this.carryCount <= 0) {
			if (this.carry == "bomb") {
				this.game.explode(this.x + this.faceing * 20, this.y + this.game.props.userHeight/2, this);
			}
			this.carry = "";
		}
	}
	this.status = this.getStatus();
	if (this.status == "dieing") {
		this.vx *= .98;
		this.vy -= .2;
		this.vy = Math.max(-9, this.vy);
		this.r += this.vr;
		this.vr *= .96;
	} if (this.status == "climbing") {
		if (this.upDown && !this.downDown && this.y < this.pilla.y2*this.game.props.blockHeight - this.game.props.userHeight) {
			this.y += 3;
		} else if (this.downDown && !this.upDown && this.y > this.pilla.y1*this.game.props.blockHeight + 3) {
			this.y -= 3;
		}
		if (this.leftDown > 60) {
			this.faceing = -1;
			this.vx = -2;
			this.onPilla = false;
		} else if (this.rightDown > 60) {
			this.faceing = 1;
			this.vx = 2;
			this.onPilla = false;
		}
	} else if (this.status == "standing") {
		if (this.leftDown && !this.rightDown) {
			if (this.vx > 0) {
				this.vx = -1;
			} else {
				this.vx -= .2;
			}
			this.faceing = -1;
			this.vx = Math.max(this.vx, -4, -this.leftDown/20);
		} else if (!this.leftDown && this.rightDown) {
			if (this.vx < 0) {
				this.vx = 1;
			} else {
				this.vx += .2;
			}
			this.faceing = 1;
			this.vx = Math.min(this.vx, 4, this.rightDown/20);
		} else {
			this.vx = 0;
		}
		if (this.upDown > 60 && !this.downDown) {
			this.vy = 5;
			this.flypackActive = false;
		} else  {
			this.vy = 0;
		}
	} else if (this.status == "rolling2") {
		this.vx *= .96;
	} else if (this.status == "rolling") {
		this.vx *= .9;
	} else if (this.status == "falling") {
		if (this.upPress && this.canDoubleJump) {
			this.doubleJumping = true;
			this.canDoubleJump = false;
			this.vy = 5;
		}
		if (this.upPress && this.carry == 'flypack') {
			this.flypackActive = true;
		}
		if (this.upDown && this.carry == "flypack" && this.carryCount > 0 && this.flypackActive) {
			this.vy += .3;
			this.flying = true;
			this.carryCount--;
		}
		this.vy -= .2;
		this.vy = Math.max(-9, this.vy);
		this.vy = Math.min(10, this.vy);
		if (this.vy == -9) {
			this.danger = true;
		}
	} else if (this.status == "crawling") {
		this.vx = 0;
	}

	//final process
	this.x += this.vx;
	if (this.x <= 0) {this.vx = Math.abs(this.vx)}
	if (this.x >= this.game.props.w) {this.vx = -Math.abs(this.vx)}
	if (this.y < 0) {
		this.dead = true;
		if (!this.dieing) {
			this.killed('fall');
		}
	} else {
		if (this.vy > 0) {
			this.y += Math.floor(this.vy);
		} else {
			for (var i = 0; i < -this.vy; i++) {
				this.y--;
				if(!this.dieing && this.game.map.onFloor(this.x, this.y)) {
					this.vy = 0;
					break;
				}
			}
		}
	}
}
User.prototype.killed = function (action, byUser) {
	if (this.dieing) {return}
	this.killer = byUser && byUser.id;
	this.dieing = true;
	this.killedBy = action;

	if (action == 'power') {
		this.vy = 10;
	} else if (action == 'drug') {
		this.vy = 3;
		this.killer = this.lastTouch;
	} else if (action == 'gun') {
		this.vy = 1;
	} else if (action == 'mine') {
		this.vy = 10;
	} else if (action == 'bomb') {
		this.vy = 8;
	} else {
		this.killer = this.lastTouch;
	}

	if (this.killer && this.killer != this.id) {
		var killer = this.game.getUser(this.killer);
		this.game.award(killer);
	}

	if (killer) {
		if (action == 'drug') {
			var message = "<b>" + killer.name + "</b>让<b>" + this.name + "</b>品尝到了毒药的滋味";
		} else if (action == 'mine') {
			if (this.killer == this.id) {
				var message = "<b>" + killer.name + "</b>用自己的身体检验了地雷的可靠性，结果很成功";
			} else {
				var message = "<b>" + killer.name + "</b>的地雷让<b>" + this.name + "</b>的菊花一紧";
			}
		} else if (action == 'gun') {
			var message = "<b>" + killer.name + "</b>开枪了，<b>" + this.name + "</b>应声倒地";
		} else if (action == 'power') {
			var message = "<b>" + killer.name + "</b>把<b>" + this.name + "</b>扔进了泥潭";
		} else if (action == 'bomb') {
			var message = "<b>" + this.name + "</b>没能从爆炸中逃生";
		} else {
			var message = "<b>" + killer.name + "</b>把<b>" + this.name + "</b>扔进了泥潭";
		}
	} else {
		if (action == 'drug') {
			var message = "<b>" + this.name + "</b>尝了一口毒药";
		} else {
			var message = "<b>" + this.name + "</b>完成了华丽的一跃";
		}
	}

	this.game.announce('userDead', {
		user: this.getDataForDeath(),
		killer: killer && killer.getData(),
		message: message
	});
}
User.prototype.getDataForDeath = function () {
	var killer = this.killer || this.lastTouch;
	if (killer) {
		var killerName = this.game.getUser(killer).name;	
	}
	return {
		killer: killer,
		killerName: killerName,
		killedBy: this.killedBy || "fall",
		name: this.name,
		id: this.id,
		x: this.x,
		y: this.y
	}
}
User.prototype.getData = function () {
	var data = {
		carry: this.carry,
		carryCount: this.carryCount,
		nearPilla: this.nearPilla ? true : false,
		faceing: this.faceing,
		fireing: this.fireing,
		danger: this.danger,
		status: this.status,
		name: this.name,
		id: this.id,
		x: this.x,
		y: this.y,
		vy: this.vy,
		score: this.score
	}
	if (this.dead) {data.dead = true}
	if (this.doubleJumping) {data.doubleJumping = true}
	if (this.flying) {data.flying = true}
	return data;
}
module.exports = User;