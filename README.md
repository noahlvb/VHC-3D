# VHC-3D

VHC-3D is a project that makes printing 3d object much easier for inexperienced 3d printer users. VHC-3D makes the hole process of printer easy and all the users gets to see is one simple and elegant interface. The user never gets to see what's going on in the background and does not need a lot of experience. It guides them from uploading your STL to holding the product in your hands.

This could be useful in school's, architect office or a creative communities enabling them to benefit from a printer without the hassle. it also makes 3D printer more economically interesting because lots of people can use one printer.

## Background

This project started of as a PWS, standing for Profile Work Piece in Dutch. It is part of your middle school exam. The goal was to make 3d printing more accessible and easy to use for every student in the school. The name 'VHC' is short for VathorstCollege which is the name of my school(I'am not that creative when it comes to naming).

## Features

- Account management
- Google Account log in
    - restrictable by domain name
- Print job approval
- Material quota per user in grams
    - renews monthly
    - Can be set per user
- Shows time and material estimates
- Changing basic Cura parameters(more is coming)
- Email notifications
- automatically pushes of the object when its done

## Inner workings

The project is written in Javascript running in Nodejs. To communicate with the printer I use Octoprint. I did this for 3 reasons and these are:

1. Octoprint was already very reliable, stable and had a good api.
2. So that you can host the project outside the location the printer is at and have VHC-3D talking to Octoprint running on a computer on location.
3. I'am lazy

For the database I choose MongoDB because its NoSQL and I had good experiences with it. The slicing of STL files is also handled via Octoprint.

## TODO

- [ ] adding more advanced Cura parameters for more experienced users.
- [ ] Fine tune the pushoff process
- [ ] Make slicing and printer simultaneously
- [x] Writing the code in a why that it can use different size 3d printers. And make de size configurable.
- [x] Auto create a admin user at first use.
- [x] Auto create the files folder and the config files at first use.
- [ ] More will come

## Run it for your self
### Requirements

- A 3D printer
    - Currently it only works with printers that have de same dimensions as the Ultimaker Original plus. Will Change
- A Linux machine connected to the printer having Octoprint installed
- Octoprint which is configured with Cura slicing.
    - Use a Cura profile with a high brim lime count to make sure the material flow is constant when the print starts.
- A Linux machine to run VHC-3D
    - Could be the same as Octorprint.

### Setup

note that the project is not yet fully production ready, I would like to have it production ready at the end of Feb 2017. although I have been using it in production for a month now.

1. clone/pull the repo.
2. Set the environment variable as mentioned in the settings file under the config folder.
3. download all the Dependencies using 'npm install'.
4. run 'node start.js'.
    - it is recommended to use something like PM2 to make sure the app will run forever.


Noah van Bochove
